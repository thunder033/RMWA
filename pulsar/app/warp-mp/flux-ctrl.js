/**
 * TODO: [Description]
 * @author Greg Rozmarynowycz <greg@thunderlab.net>
 */
const MDT = require('../mallet/mallet.dependency-tree').MDT;
const GameEvent = require('event-types').GameEvent;
const Track = require('game-params').Track;

module.exports = {FluxCtrl,
resolve: ADT => [
    ADT.ng.$scope,
    MDT.Scheduler,
    MDT.Camera,
    MDT.Geometry,
    MDT.Math,
    MDT.Keyboard,
    MDT.const.Keys,
    FluxCtrl]};

/**
 *
 * @param $scope
 * @param MScheduler
 * @param Camera {Camera}
 * @param Geometry
 * @param MM
 * @param Keyboard
 * @param Keys
 * @constructor
 */
function FluxCtrl($scope, MScheduler, Camera, Geometry, MM, Keyboard, Keys) {
    const meshes = Geometry.meshes;
    const mLanePadding = 0.01; //padding on edge of each lane

    const tLane = new Geometry.Transform()
        .scaleBy(Track.LANE_WIDTH - mLanePadding, 1, 60)
        .translate(0, -0.1, -37);
    tLane.origin.z = -0.5;
    const grey = MM.vec3(225,225,225);

    function drawLanes(camera) {
        tLane.position.x = Track.POSITION_X + Track.LANE_WIDTH / 2;
        for(let i = 0; i < Track.NUM_LANES; i++) {
            camera.render(meshes.XZQuad, tLane, grey);
            tLane.position.x += Track.LANE_WIDTH;
        }
        camera.present(); //Draw the background
    }

    function drawBars() {

    }

    function init() {
        const tCube = new Geometry.Transform();
        tCube.scale.scale(0.5);

        const players = $scope.warpGame.getPlayers();
        let clientShip = null;
        console.log($scope.clientUser);
        const ships = players.map((player) => {
            console.log('check user', player.getUser());
            if (player.getUser() === $scope.clientUser) {
                clientShip = player.getShip();
            }
            return player.getShip();
        });

        console.log(ships);
        console.log(clientShip);
        $scope.posX = 0;

        function sendKeysReleased() {
            if(!Keyboard.isKeyDown(Keys.Left) && !Keyboard.isKeyDown(Keys.Right)) {
                clientShip.strafe(0);
            }
        }

        Keyboard.onKeyDown(Keys.Left, () => clientShip.strafe(-1));
        Keyboard.onKeyDown(Keys.Right, () => clientShip.strafe(1));

        Keyboard.onKeyUp(Keys.Left, sendKeysReleased);
        Keyboard.onKeyUp(Keys.Right, sendKeysReleased);

        MScheduler.schedule(() => {
            const rot = (~~performance.now()) / 200;
            tCube.rotation.x = rot;
            tCube.rotation.y = rot;
            tCube.rotation.z = rot;
            $scope.posX = clientShip.getTransform().position.x.toFixed(3);
            $scope.lossPct = ~~(clientShip.getDataLoss() * 100);
            $scope.updateTime = clientShip.getUpdateTime();

            MScheduler.draw(() => {
                drawLanes(Camera);

                players.forEach(player => Camera.render(
                    Geometry.meshes.Ship,
                    player.getShip().getTransform(),
                    player.getColor()));

                Camera.render(Geometry.meshes.Cube, [tCube], MM.vec3(255, 0, 0));
                Camera.present();
            });
        });
    }

    $scope.$on('$destroy', () => {
        MScheduler.reset();
    });

    $scope.$on(GameEvent.playStarted, init);
}
