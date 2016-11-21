/**
 * Created by Greg on 11/2/2016.
 */
"use strict";
angular.module('mallet').service('MCamera', ['MalletMath', 'MEasel', 'Shapes', 'Geometry', 'MColor', 'MScheduler', 'mallet.state', function (MM, MEasel, Shapes, Geometry, Color, MScheduler, MState) {

    var Mesh = Geometry.Mesh,
        drawCalls = new PriorityQueue(),
        self = this;

    this.renderRatio = 100;

    this.getLensAngle = () => {
        var focalLength = 70;
        return Math.atan(1 / focalLength);
    };

    //position of the camera in 3d space
    this.position = MM.vec3(0, .2, 10);
    var light = MM.vec3(-1, -1, -1).normalize();

    this.toVertexBuffer = (verts) => {
        var buffer = new Float32Array(verts.length * Mesh.vertSize);
        verts.forEach((vert, i) => {
            buffer[i * Mesh.vertSize] = vert.x;
            buffer[i * Mesh.vertSize + 1] = vert.y;
            buffer[i * Mesh.vertSize + 2] = vert.z;
        });
    
        return buffer;
    };

    /**
     *
     * @param buffer {Float32Array}
     * @param size {Vector3}
     * @param pos {Vector3}
     * @param scale {Vector3}
     * @param rot {Vector3}
     * @param origin {Vector3}
     * @returns {*}
     */
    this.applyTransform = function (buffer, size, pos, scale, rot, origin) {
        origin = origin || new MM.vec3(0);
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

        for(var i = 0; i < buffer.length; i += Mesh.vertSize){
            var x = (buffer[i]     - origin.x * size.x / 2) * scale.x,
                y = (buffer[i + 1] - origin.y * size.y / 2) * scale.y,
                z = (buffer[i + 2] - origin.z * size.z / 2) * scale.z;

            //console.log(`${x} ${y} ${z}`);

            buffer[i + 0] = pos.x + (x * M11 + y * M12a + y * M12b + z * M13a + z * M13b);
            buffer[i + 1] = pos.y + (x * M21 + y * M22a + y * M22b + z * M23a + z * M23b);
            buffer[i + 2] = pos.z + (x * M31 + y * M32 + z * M33);
        }

        return buffer;
    };

    /**
     * Calculate which faces are facing the camera and should be rendered
     * @param buffer {Float32Array} a buffer of vertices
     * @param normals {Float32Array} a buffer of the normals
     * @param indices {Array|Int8Array} listing of indices that form the faces
     * @returns {Int8Array} array containing 0 (don't render) or 1 (render) for each face
     */
    this.getCulledFaces = (buffer, normals, indices) => {

        var culledFaces = new Int8Array(~~(indices.length / 3));
        for(var i = 0; i < indices.length; i += 3) {
            var v1 = indices[i] * Mesh.vertSize,
                v2 = indices[i + 1] * Mesh.vertSize,
                v3 = indices[i + 2] * Mesh.vertSize,

                //Get the coordinates of each point in the tri
                aX = buffer[v1], aY = buffer[v1 + 1], aZ = buffer[v1 + 2], //P1
                bX = buffer[v2], bY = buffer[v2 + 1], bZ = buffer[v2 + 2], //P2
                cX = buffer[v3], cY = buffer[v3 + 1], cZ = buffer[v3 + 2], //P3
                
                //Calculate centroid
                centroidX = (aX + bX + cX) / 3,
                centroidY = (aY + bY + cY) / 3, 
                centroidZ = (aZ + bZ + cZ) / 3,
                
                //Calculate to triangle vector
                toTriX = self.position.x - centroidX,
                toTriY = self.position.y - centroidY,
                toTriZ = self.position.z - centroidZ;

            //Not sure if we need to normalize or not, but doesn't appear so...
                //toTriLen = Math.sqrt(toTriX * toTriX + toTriY * toTriY + toTriZ * toTriZ);

            //toTriX /= toTriLen;
            //toTriY /= toTriLen;
            //toTriZ /= toTriLen;

            var normalX = normals[i],
                normalY = normals[i + 1],
                normalZ = normals[i + 2],

                //Calculate the dot product of the displacement vector and the face normal
                dot = toTriX * normalX + toTriY * normalY + toTriZ * normalZ;

            //If the dot product is great than or equal to zero, the face will not be rendered
            //A 0 dot product means the faces is perpendicular and will not be seen
            //A do product of great than one means the face is facing away from the camera
            var faceIndex = ~~(i / 3);
            culledFaces[faceIndex] = (dot >= 0) ? 0 : 1;
        }

        return culledFaces;
    };

    this.projectPoint = function(buffer){
        var tanLensAngle = Math.tan(self.getLensAngle()),
            ctx = MEasel.context,
            viewport = MM.vec2(ctx.canvas.height, ctx.canvas.height),
            screenCenter = MM.vec2(ctx.canvas.width / 2, viewport.y / 2); //center of the viewport

        //Get the displacement of the vertex
        var dispX = buffer[0] - self.position.x,
            //negative because screen space is inverted
            dispY = -(buffer[1] - self.position.y),
            dispZ = self.position.z - buffer[2];

        //Transform the vertex into screen space
        var distance = Math.sqrt(dispX * dispX + dispY * dispY + dispZ * dispZ);
        var fieldScale = Math.abs(1 / (distance / 5 * tanLensAngle)),
            screenX = dispX * fieldScale * viewport.x / self.renderRatio + screenCenter.x,
            screenY = dispY * fieldScale * viewport.y / self.renderRatio + screenCenter.y;

        return [screenX, screenY, fieldScale];
    };

    this.projectBuffer = (buffer, culledFaces, normals, indices, drawQueue, color) => {
        var tanLensAngle = Math.tan(self.getLensAngle()),
            ctx = MEasel.context,
            viewport = MM.vec2(ctx.canvas.height, ctx.canvas.height),
            screenCenter = MM.vec2(ctx.canvas.width / 2, viewport.y / 2); //center of the viewport

        var faceBufferIndex = 0,
            faceIndex = 0,
            //Each 2D project face will have 6 coordinates
            faceBuffer = new Float32Array(6);

        drawQueue = drawQueue || new PriorityQueue();

        var avgDist = 0,
            faceSize = 3;

        for(var i = 0; i < indices.length; i ++) {
            //If the face is facing away from the camera, don't render it
            if(culledFaces[(i - (i % faceSize)) / faceSize] === 0){
                continue;
            }

            var b = indices[i] * Mesh.vertSize,
            //Get the displacement of the vertex
                dispX = buffer[b] - self.position.x,
            //negative because screen space is inverted
                dispY = -(buffer[b + 1] - self.position.y),
                dispZ = self.position.z - buffer[b + 2];

            //Transform the vertex into screen space
            var distance = Math.sqrt(dispX * dispX + dispY * dispY + dispZ * dispZ);
            avgDist += distance / faceSize;
            var fieldScale = Math.abs(1 / (distance / 5 * tanLensAngle)),
                screenX = dispX * fieldScale * viewport.x / self.renderRatio + screenCenter.x,
                screenY = dispY * fieldScale * viewport.y / self.renderRatio + screenCenter.y;

            //Insert the screen coordinates into the screen buffer
            faceBuffer[faceBufferIndex++] = screenX;
            faceBuffer[faceBufferIndex++] = screenY;

            //Push the vertices into face buffer
            if((i + 1) % faceSize == 0){
                faceIndex = (i - (i % faceSize)) / faceSize;
                var normalX = normals[faceIndex * 3],
                    normalY = normals[faceIndex * 3 + 1],
                    normalZ = normals[faceIndex * 3 + 2],
                    dot = light.x * normalX + light.y * normalY + light.z * normalZ,
                    //Clamp the light amount to 1 and make sure it is positive
                    lightAmt = Math.min(.2 + Math.max(0, dot), 1);

                drawQueue.enqueue(1000 - avgDist, {
                    buffer: faceBuffer.slice(),
                    end: faceSize * 2,
                    color: MM.Vector3.scale(color, lightAmt)});

                avgDist = 0;
                faceBufferIndex = 0;
            }
        }

        return drawQueue;
    };

    /**
     * Draws a set of screen vertices using canvas path
     * @param ctx
     * @param buffer {Float32Array}
     * @param end {number}
     */
    this.drawFace = (ctx, buffer, end) => {

        ctx.beginPath();
        ctx.moveTo(buffer[0], buffer[1]);

        var i = 2;
        while(i < end){
            ctx.lineTo(buffer[i++], buffer[i++]);
        }

        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    };

    /**
     *
     * @param {Array<Image>} images
     * @param {Transform[]} transforms
     * @param {Transform} [parent]
     */
    this.billboardRender = (images, transforms, parent) => {
        //wrap a raw transform in an array
        transforms = (transforms instanceof Array) ? transforms : [transforms];
        parent = parent || new Geometry.Transform();

        //create a queue to store the draw commands generated
        var ctx = MEasel.context;

        for(var t = 0; t < transforms.length; t++) {
            if (transforms[t] === null || typeof transforms[t] !== 'object') {
                continue;
            }

            var buffer = transforms[t].position.toBuffer(),
                image = images[~~(Math.random() * images.length)];

            var screenCoords = self.projectPoint(buffer),
                fieldScale = screenCoords[2] / 30;

            ctx.save();
            ctx.translate(screenCoords[0] - (image.width / 2) * fieldScale, screenCoords[1] - (image.height / 2) * fieldScale);
            ctx.scale(
                transforms[t].scale.x * parent.scale.x * fieldScale,
                transforms[t].scale.y * parent.scale.y * fieldScale);
            //Make the particles fade as they near the end of their life
            //ctx.globalAlpha = Math.min(particles[i].energy / 500, .75);
            ctx.drawImage(image, 0, 0);
            ctx.restore();
        }
    };

    /**
     * Render an instance of the mesh for each transform provided, with the given color
     * @param mesh {Mesh}
     * @param transforms {Transform|Array<Transform>}
     * @param color {Vector3}
     */
    this.render = (mesh, transforms, color) => {

        //wrap a raw transform in an array
        transforms = (transforms instanceof Array) ? transforms : [transforms];
        //create a queue to store the draw commands generated

        for(var t = 0; t < transforms.length; t++){
            if(transforms[t] === null || typeof transforms[t] !== 'object'){
                continue;
            }

            //Don't render things that are behind the camera
            //TODO: this needs to be changed be based off camera camera position/perspective
            if(self.position.z - transforms[t].position.z < 0){
                if(MState.is(MState.Debug)){ //TODO: add logging levels (this would be VERY verbose)
                    //console.warn('Mesh at ' + transforms[t].position + ' was skipped');
                }

                continue;
            }

            //Get a transformed vertex buffer for the mesh
            var buffer = self.applyTransform(mesh.getVertexBuffer(), mesh.size, transforms[t].position, transforms[t].scale, transforms[t].rotation, transforms[t].origin),
                //Generate a buffer of the transformed face normals
                normalsBuffer = self.applyTransform(self.toVertexBuffer(mesh.normals), MM.Vector3.Zero, MM.Vector3.Zero, MM.Vector3.One, transforms[t].rotation, MM.Vector3.Zero),
                //Determine which faces will be cull (don't render back faces)
                culledFaces = self.getCulledFaces(buffer, normalsBuffer, mesh.indices);

            //Project the buffer into the camera's viewport
            self.projectBuffer(buffer, culledFaces, normalsBuffer, mesh.indices, drawCalls, color);
        }
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
            relPosition = MM.vec3(pos.x - self.position.x, -(pos.y - self.position.y), self.position.z - pos.z),
            lensAngle = self.getLensAngle(); //the viewing angle of the lens, large is more stuff visible

        //Don't draw things that are in front of the camera
        if(relPosition.z <= 0){
            return;
        }

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

            var fieldRadius = (relPosition.z + pt.z) * Math.tan(lensAngle); //FOV radius at the point
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
    };

   this.present = () => {
        var ctx = MEasel.context, face, callCount = 0;
        ctx.lineWidth = 1;
        //Execute each draw call to display the scene
        while(drawCalls.peek() != null){
            callCount++;
            face = drawCalls.dequeue();
            //Apply lighting calculations to the mesh color
            ctx.fillStyle = ctx.strokeStyle = Color.rgbaFromVector(face.color);
            //Draw the face
            self.drawFace(MEasel.context, face.buffer, face.end);
        }
    };

    MScheduler.schedule(()=>{
        MScheduler.draw(self.present, 0);
    });

}]);