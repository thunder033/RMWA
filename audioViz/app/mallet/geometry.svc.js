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
        this.normals = Mesh.buildNormals(this.indices, this.verts) || [];
        console.log(this.normals);
        Object.seal(this);
    }

    Mesh.vertSize = 3;

    Mesh.prototype.getVertexBuffer = function(){
        var buffer = new Float32Array(this.verts.length * Mesh.vertSize);
        this.verts.forEach((vert, i) => {
            var vertIndex = i * Mesh.vertSize;
            buffer[vertIndex] = vert.x;
            buffer[vertIndex + 1] = vert.y;
            buffer[vertIndex + 2] = vert.z;
        });

        return buffer;
    };

    Mesh.buildNormals = function(indices, verts){
        if(indices.length % 3 != 0){
            return;
        }

        console.log(indices.length);
        var faceNormals = new Array(Math.floor(indices.length / 3));
        for(var i = 0; i < indices.length; i += 3){
            var a = verts[indices[i]], b = verts[indices[i + 1]], c = verts[indices[i + 2]];
            var ab = MM.Vector3.subtract(b, a),
                ac = MM.Vector3.subtract(c, a),
                normal = ab.cross(ac).normalize();
                //unitNormal = normal.unit(),
                //toCircumcenter = (normal.cross(ab).scale(ac.len2()) + ac.cross(normal).scale(ab.len2())),
                //circumcenter = MM.Vector3.add(a, toCircumcenter);
                //aAB = Math.acos(a.normalize().dot(b.normalize())) * Math.sign(a.cross(b).dot(normal)),
                //aAC = Math.acos(a.normalize().dot(c.normalize())) * Math.sign(a.cross(c).dot(normal));
                //angle = Math.acos(ab.normalize().dot(ac.normalize())) * Math.sign(ab.cross(ac).dot(unitNormal));

            var faceIndex = i / 3;
            faceNormals[faceIndex] = normal;
            //console.log(`Face ${faceIndex}: ${angle} ${normal} ${unitNormal}`);
        }

        return faceNormals;
    };

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

    var meshes = {
        XYQuad: new Mesh([
                MM.vec3(-.5, -.5, 0),
                MM.vec3(-.5, +.5, 0),
                MM.vec3(+.5, +.5, 0),
                MM.vec3(+.5, -.5, 0)],
            [0, 1, 2,  0, 2, 3]),
        XZQuad: new Mesh([
                MM.vec3(-.5, 0, -.5),
                MM.vec3(-.5, 0, +.5),
                MM.vec3(+.5, 0, +.5),
                MM.vec3(+.5, 0, -.5)],
            [0, 1, 2,  0, 2, 3]),
        Cube: new Mesh([
                /**  5  +---+ 6
                 *    /   / |
                 * 1 +---+2 + 7
                 *   |   | /
                 * 0 +---+ 3
                 */
                MM.vec3(-.5, -.5, +.5), //LBF 0
                MM.vec3(-.5, +.5, +.5), //LTF 1
                MM.vec3(+.5, +.5, +.5), //RTF 2
                MM.vec3(+.5, -.5, +.5), //RBF 3

                MM.vec3(-.5, -.5, -.5), //LBB 4
                MM.vec3(-.5, +.5, -.5), //LTB 5
                MM.vec3(+.5, +.5, -.5), //RTB 6
                MM.vec3(+.5, -.5, -.5)],//RBB 7
            [
                0, 1, 2,  0, 2, 3, //F
                2, 6, 3,  3, 6, 7, //R
                1, 5, 6,  1, 6, 2, //T

                4, 6, 5,  4, 7, 6, //Back
                0, 5, 1,  0, 4, 5, //L
                0, 3, 7,  0, 7, 4  //Bottom
            ])
    };

    return {
        Transform: Transform,
        Mesh: Mesh,

        meshes: meshes
    }
}]);