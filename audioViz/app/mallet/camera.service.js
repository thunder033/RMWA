/**
 * Created by Greg on 11/2/2016.
 */
"use strict";
angular.module('mallet').service('MCamera', ['MalletMath', 'MEasel', 'Shapes', function (MM, MEasel, Shapes) {

    var vertSize = 3,
        self = this;

    this.renderRatio = 100;

    this.getLensAngle = () => {
        var focalLength = 70;
        return Math.atan(1 / focalLength);
    };

    //position of the camera in 3d space
    this.position = MM.vec3(0, .2, -10);

    this.toVertexBuffer = (verts) => {
        var buffer = new Float32Array(verts.length * vertSize);
        verts.forEach((vert, i) => {
            buffer[i * vertSize] = vert.x;
            buffer[i * vertSize + 1] = vert.y;
            buffer[i * vertSize + 2] = vert.z;
        });

        return buffer;
    };

    /**
     *
     * @param buffer {Float32Array}
     * @param pos {Vector3}
     * @param scale {Vector3}
     * @param rot {Vector3}
     * @returns {*}
     */
    this.applyTransform = function (buffer, pos, scale, rot) {
        var Cx = Math.cos(rot.x),
            Cy = Math.cos(rot.y),
            Cz = Math.cos(rot.z),
            Sx = Math.sin(rot.x),
            Sy = Math.sin(rot.y),
            Sz = Math.sin(rot.z),

        /*
         * Euler rotation matrix
         * http://what-when-how.com/advanced-methods-in-computer-graphics/quaternions-advanced-methods-in-computer-graphics-part-2/
         * [  Cy * Cz,  Cx * Sz + Sx * Sy * Cz, Sx * Sz - Cx * Sy * Cz ]
         * [ -Cy * Sz,  Cx * Cz - Sx * Sy * Sz, Sx * Cz + Cx * Sy * Sz ]
         * [  Sy,      -Sx * Cy,                Cx * Cy                ]
         */
            M11 = +Cy * Cz, M12a = Cx * Sz, M12b = + Sx * Sy * Cz, M13a = Sx * Sz, M13b = - Cx * Sy * Cz,
            M21 = -Cy * Sz, M22a = Cx * Cz, M22b = - Sx * Sy * Sz, M23a = Sx * Cz, M23b = + Cx * Sy * Sz,
            M31 = Sy, M32 = -Sx * Cy, M33 = Cx * Cy;

        for(var i = 0; i < buffer.length; i += 3){
            var x = buffer[i], y = buffer[i + 1], z = buffer[i + 2];

            buffer[i + 0] = pos.x + (x * M11 + y * M12a + y * M12b + z * M13a + z * M13b) * scale.x;
            buffer[i + 1] = pos.y + (x * M21 + y * M22a + y * M22b + z * M23a + z * M23b) * scale.y;
            buffer[i + 2] = pos.z + (x * M31 + y * M32 + z * M33) * scale.z;
        }

        return buffer;
    };

    this.projectBuffer = (buffer, indices, drawQueue) => {
        var tanLensAngle = Math.tan(self.getLensAngle()),
            ctx = MEasel.context,
            viewport = MM.vec2(ctx.canvas.height, ctx.canvas.height),
            screenCenter = MM.vec2(ctx.canvas.width / 2, viewport.y / 2); //center of the viewport

        var faceBufferIndex = 0,
            faceBuffer = new Float32Array(8);

        drawQueue = drawQueue || new PriorityQueue();

        var avgDist = 0,
            faceSize = 3;

        for(var i = 0; i < indices.length; i++) {
            var index = indices[i];
            if(index < 0){ //A negative index indicates we are drawing a quad
                faceSize = 4;
                index = -index;
            }

            index--; //Input indices are 1 based

            var b = index * vertSize,
            //Get the displacement of the vertex
                dispX = buffer[b] - self.position.x,
                dispY = -(buffer[b + 1] - self.position.y),
                dispZ = buffer[b + 2] - self.position.z;

            avgDist += dispZ / faceSize;

            //Transform the vertex into screen space
            var fieldScale = 1 / (dispZ / 5 * tanLensAngle),
                screenX = dispX * fieldScale * viewport.x / self.renderRatio + screenCenter.x,
                screenY = dispY * fieldScale * viewport.y / self.renderRatio + screenCenter.y;

            //Insert the screen coordinates into the screen buffer
            faceBuffer[faceBufferIndex++] = screenX;
            faceBuffer[faceBufferIndex++] = screenY;

            //Push the vertices into face buffer
            if((i + 1) % faceSize == 0){
                drawQueue.enqueue(1000 - avgDist, {buffer: faceBuffer.slice(), end: faceSize * 2});
                faceSize = 3;
                avgDist = 0;
                faceBufferIndex = 0;
            }
        }

        return drawQueue;
    };

    this.drawFace = (ctx, buffer, end) => {

        ctx.beginPath();
        ctx.moveTo(buffer[0], buffer[1]);

        var i =0;
        while(i < end){
            ctx.lineTo(buffer[i++], buffer[i++]);
        }

        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    };

    this.render = (mesh, transforms, color) => {

        transforms = (transforms instanceof Array) ? transforms : [transforms];
        var drawCalls = new PriorityQueue();

        for(var t = 0; t < transforms.length; t++){
            if(transforms[t].position.z < self.position.z){
                continue;
            }

            //Get a transformed vertex buffer for the mesh
            var buffer = self.applyTransform(self.toVertexBuffer(mesh.verts), transforms[t].position, transforms[t].scale, transforms[t].rotation);
            self.projectBuffer(buffer, mesh.indices, drawCalls);
        }

        var ctx = MEasel.context;
        ctx.fillStyle = color;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;

        var face, callCount = 0;
        while(drawCalls.peek() != null){
            callCount++;
            //console.log('draw call');
            face = drawCalls.dequeue();
            self.drawFace(MEasel.context, face.buffer, face.end);
        }

        console.log(callCount);
    };

    /**
     * Draws a rectangle in the Z plane - derived from Hammer code (Camera.cs)
     * @param shape
     * @param pos {Vector3}
     * @param width {Number} size of shape on x-axis
     * @param depth {Number} size of shape on z-axis
     * @param zRot {Number} rotation on z-axis
     */
    this.drawShape = function(shape, pos, width, depth, zRot){
        //Don't draw things that are in front of the camera
        if(pos.z <= 0){
            return;
        }

        var verts = [];

        if(shape === Shapes.Triangle){
            verts = [
                MM.vec3(-width / 2, 0, 0),
                MM.vec3(0, 0, depth),
                MM.vec3(+width / 2, 0, 0)];
        }
        else if(shape === Shapes.Quadrilateral){
            verts = [
                MM.vec3(-width / 2, 0, 0),
                MM.vec3(-width / 2, 0, depth),
                MM.vec3(+width / 2, 0, depth),
                MM.vec3(+width / 2, 0, 0)];
        }

        zRot = zRot || 0;
        var ctx = MEasel.context,
            viewport = MM.vec2(ctx.canvas.width, ctx.canvas.height),
            screenCenter = MM.vec2(viewport.x / 2, viewport.y / 2), //center of the viewport

        //position of the object relative to the camera
        //The Y position is inverted because screen space is reversed in Y
            relPosition = MM.vec3(pos.x - self.position.x, -(pos.y - self.position.y), pos.z - self.position.z),
            lensAngle = self.getLensAngle(); //the viewing angle of the lens, large is more stuff visible

        ctx.save();
        ctx.beginPath();

        //Draw the shape with each point
        verts.forEach((pt, index) => {
            var screenPos = MM.vec2(
                /**
                 * { cos -sin }
                 * { sin  cos }
                 */
                //x' = x * cos(theta) - y * sin(theta)
                pt.x * Math.cos(zRot) - pt.y * Math.sin(zRot) + relPosition.x,
                //y' = y * cos(theta) + x * sin(theta)
                pt.x * Math.sin(zRot) + pt.y * Math.cos(zRot) + relPosition.y
            );

            var fieldRadius = (pos.z + pt.z) * Math.tan(lensAngle); //FOV radius at the point
            //Transform the point into screen space
            screenPos
                .scale(1 / fieldRadius) //1. Scale by the depth of the point
                .mult(viewport)         //2. Scale to the size of the viewport
                .add(screenCenter);     //3. Move relative to the screen center

            //Add the point to the path (move for the first point)
            (index === 0 ? ctx.moveTo : ctx.lineTo).call(ctx, screenPos.x, screenPos.y);
        });

        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}]);