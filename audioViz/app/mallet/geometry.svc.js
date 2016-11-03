/**
 * Created by gjrwcs on 11/3/2016.
 */
"use strict";
angular.module('mallet') .factory('Geometry', ['MalletMath', function(MM){
    function Transform(){
        this.position = new MM.Vector3(0);
        this.scale = new MM.Vector3(1);
        this.rotation = new MM.Vector3(0);
        this.origin = new MM.Vector3(0);
        Object.seal(this);
    }

    function Mesh(verts, indices){
        this.verts = verts;
        this.indices = indices;
        this.size = Mesh.getSize(verts);
        Object.seal(this);
    }

    /**
     * Get the dimensions of the mesh buffer
     * @param verts
     */
    Mesh.getSize = (verts) => {
        if(verts.length === 0){
            return;
        }

        var min = verts[0].clone();
        var max = verts[0].clone();

        verts.forEach(v => {
            if(v.x < min.x)
                min.x = v.x;
            else if(v.x > max.x)
                max.x = v.x;

            if(v.y < min.y)
                min.y = v.y;
            else if(v.y > max.y)
                max.y = v.y;

            if(v.z < min.z)
                min.z = v.z;
            else if(v.z > max.z)
                max.z = v.z;
        });

        return MM.Vector3.subtract(max, min);
    };

    return {
        Transform: Transform,
        Mesh: Mesh,

        meshes: {
            XYQuad: new Mesh([
                    MM.vec3(-.5, -.5, 0),
                    MM.vec3(-.5, +.5, 0),
                    MM.vec3(+.5, +.5, 0),
                    MM.vec3(+.5, -.5, 0)],
                [-1, 2, 3, 4]),
            XZQuad: new Mesh([
                    MM.vec3(-.5, 0, -.5),
                    MM.vec3(-.5, 0, +.5),
                    MM.vec3(+.5, 0, +.5),
                    MM.vec3(+.5, 0, -.5)],
                [-1, 2, 3, 4]),
            Cube: new Mesh([
                    MM.vec3(-.5, -.5, +.5), //LBF
                    MM.vec3(-.5, +.5, +.5), //LTF
                    MM.vec3(+.5, +.5, +.5), //RTF
                    MM.vec3(+.5, -.5, +.5), //RBF

                    MM.vec3(-.5, -.5, -.5), //LBB
                    MM.vec3(-.5, +.5, -.5), //LTB
                    MM.vec3(+.5, +.5, -.5), //RTB
                    MM.vec3(+.5, -.5, -.5)],//RBB
                [
                    -1, 2, 3, 4, //F
                    -3, 4, 8, 7, //R
                    -2, 3, 7, 6, //T

                    -5, 6, 7, 8, //Back
                    -1, 2, 6, 5, //L
                    -1, 4, 8, 5 //Bottom
                ])
        }
    }
}]);