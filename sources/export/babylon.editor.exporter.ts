﻿module BABYLON.EDITOR {
    export class Exporter {
        // public members
        public core: EditorCore;

        // private members
        private _window: GUI.GUIWindow = null;
        private _editor: AceAjax.Editor = null;

        private _editorID: string = "BABYLON-EDITOR-EXPORT-WINDOW-EDITOR";

        private _generatedCode: string = "";

        /**
        * Constructor
        */
        constructor(core: EditorCore) {
            // Initialize
            this.core = core;
        }

        // Opens the scene exporter
        public openSceneExporter(): void {
            // Create window
            var windowBody = GUI.GUIElement.CreateDivElement(this._editorID, "width: 100%; height: 100%");

            this._window = new GUI.GUIWindow("WindowExport", this.core, "Export Project", windowBody);
            this._window.buildElement(null);

            this._window.onToggle = (maximized: boolean, width: number, height: number) => {
                this._editor.resize();
            };

            // Create ace editor
            this._editor = ace.edit(this._editorID);
            this._editor.setTheme("ace/theme/clouds");
            this._editor.getSession().setMode("ace/mode/javascript");

            // Finish
            this._generatedCode = this._generateCode();
        }

        // Generates the code
        private _generateCode(): string {
            var scene = this.core.currentScene;
            var finalString = [
                "var getTextureByName = " + this._getTextureByName + "\n",
                "function CreateBabylonScene(scene) {",
                "\tvar engine = scene.getEngine();",
                "\tvar node = null;\n",
                this._exportReflectionProbes(),
                this._traverseNodes(),
                "}\n"
            ].join("\n");

            this._editor.setValue(finalString, -1);

            return finalString;
        }
        
        // Export reflection probes
        private _exportReflectionProbes(): string {
            var scene = this.core.currentScene;

            var finalString = "\t// Export reflection probes\n";
            finalString += "\t var reflectionProbe = null;";

            var t = new ReflectionProbe("", 512, scene, false);

            for (var i = 0; i < scene.reflectionProbes.length; i++) {
                var rp = scene.reflectionProbes[i];
                var texture = rp.cubeTexture;

                if (rp.name === "")
                    continue;

                finalString += "\treflectionProbe = new BABYLON.ReflectionProbe(\"" + rp.name + "\", " + texture.getSize().width + ", scene, " + texture._generateMipMaps + ");\n";

                // Render list
                for (var j = 0; j < rp.renderList.length; j++) {
                    var node = rp.renderList[j];
                    finalString += "\treflectionProbe.renderList.push(scene.getNodeByName(\"" + node.name + "\"));\n";
                }
            }

            return finalString;
        }

        // Export node's transformation
        private _exportNodeTransform(node: any): string {
            var finalString = "";

            if (node.position) {
                finalString += "\tnode.position = " + this._exportVector3(node.position) + ";\n";
            }

            if (node.rotation) {
                finalString += "\tnode.rotation = " + this._exportVector3(node.rotation) + ";\n";
            }

            if (node.rotationQuaternion) {
                finalString += "\tnode.rotationQuaternion = " + this._exportQuaternion(node.rotationQuaternion) + ";\n";
            }

            if (node.scaling) {
                finalString += "\tnode.scaling = " + this._exportVector3(node.scaling) + ";\n";
            }

            return finalString;
        }

        // Returns a BaseTexture from its name
        private _getTextureByName(name: string, scene: Scene): BaseTexture {
            // "this" is forbidden since this code is exported directly
            for (var i = 0; i < scene.textures.length; i++) {
                var texture = scene.textures[i];
                
                if (texture.name === name) {
                    return texture;
                }
            }

            return null;
        }

        // Export node's material
        private _exportNodeMaterial(node: AbstractMesh | SubMesh, subMeshId?: number): string {
            var finalString = "\n";
            var material: Material = null;

            //node.material;
            if (node instanceof AbstractMesh) {
                material = node.material;
            }
            else if (node instanceof SubMesh) {
                material = node.getMaterial();
            }

            if (!material)
                return finalString;

            // Set constructor
            var materialString = "\tnode.material";
            if (node instanceof SubMesh) {
                materialString = "\tnode.material.subMaterials[" + subMeshId + "]";
            }

            if (material instanceof StandardMaterial) {
                finalString += materialString + " = new BABYLON.StandardMaterial(\"" + material.name + "\", scene);\n";
            }
            else if (material instanceof PBRMaterial) {
                finalString += materialString + " =  new BABYLON.PBRMaterial(\"" + material.name + "\", scene);\n";
            }

            // Set values
            for (var thing in material) {
                var value = material[thing];
                var result = "";

                if (thing[0] === "_")
                    continue;

                if (typeof value === "number" || typeof value === "boolean") {
                    result += value;
                }
                else if (value instanceof Vector3) {
                    result += this._exportVector3(value);
                }
                else if (value instanceof Vector2) {
                    result += this._exportVector2(value);
                }
                else if (value instanceof Color3) {
                    result += this._exportColor3(value);
                }
                else if (value instanceof Color4) {
                    result += this._exportColor4(value);
                }
                else if (value instanceof BaseTexture) {
                    result += "getTextureByName(\"" + value.name + "\", scene)";
                }
                else
                    continue;

                if (node instanceof AbstractMesh) {
                    finalString += "\tnode.material." + thing + " = " + result + ";\n";
                }
                else if (node instanceof SubMesh) {
                    finalString += "\tnode.material.subMaterials[" + subMeshId + "]." + thing + " = " + result + ";\n";
                }
            }

            return finalString + "\n";
        }

        private _exportParticleSystem(particleSystem: ParticleSystem): string {
            var node = particleSystem.emitter;

            var finalString = "\tnode = new BABYLON.Mesh(\"" + node.name + "\", scene, null, null, true);\n";
            finalString += "\tvar particleSystem = new BABYLON.ParticleSystem(\"" + particleSystem.name + "\", " + particleSystem.getCapacity() + ", scene);\n"
            finalString += "\tparticleSystem.emitter = node;\n";

            for (var thing in particleSystem) {
                if (thing[0] === "_")
                    continue;

                var value = particleSystem[thing];
                var result = "";
                
                if (typeof value === "number" || typeof value === "boolean") {
                    result += value;
                }
                else if (typeof value === "string") {
                    result += "\"" + value + "\"";
                }
                else if (value instanceof Vector3) {
                    result = this._exportVector3(value);
                }
                else if (value instanceof Color4) {
                    result += this._exportColor4(value);
                }
                else if (value instanceof Texture) {
                    result += "BABYLON.Texture.CreateFromBase64String(\"" + value._buffer + "\", \"" + value.name + "\", scene)";
                }
                else
                    continue;

                finalString += "\tparticleSystem." + thing + " = " + result + ";\n";
            }

            if (!(<any>particleSystem)._stopped)
                finalString += "\tparticleSystem.start();\n";

            return finalString;
        }

        // Exports a light
        private _exportLight(light: Light): string {
            var finalString = "";
            var shadows = light.getShadowGenerator();

            if (!shadows)
                return finalString;
            
            for (var thing in light) {
                if (thing[0] === "_")
                    continue;

                var value = light[thing];
                var result = "";

                if (typeof value === "number" || typeof value === "boolean") {
                    result += value;
                }
                else if (typeof value === "string") {
                    result += "\"" + value + "\"";
                }
                else if (value instanceof Vector3) {
                    result += this._exportVector3(value);
                }
                else if (value instanceof Vector2) {
                    result += this._exportVector2(value);
                }
                else if (value instanceof Color3) {
                    result += this._exportColor3(value);
                }
                else
                    continue;

                finalString += "\tnode." + thing + " = " + result + ";\n";
            }

            finalString += "\n";

            // Shadow generator
            var shadowsGenerator = light.getShadowGenerator();
            if (!shadowsGenerator)
                return finalString;

            var serializationObject = shadowsGenerator.serialize();

            finalString +=
                "\tvar shadowGenerator = node.getShadowGenerator();\n"
                + "\tif (!shadowGenerator) {\n" // Do not create another
                + "\t\tshadowGenerator = new BABYLON.ShadowGenerator(" + serializationObject.mapSize + ", node);\n";

            for (var i = 0; i < serializationObject.renderList.length; i++) {
                var mesh = serializationObject.renderList[i];
                finalString += "\t\tshadowGenerator.getShadowMap().renderList.push(scene.getMeshById(\"" + mesh.id + "\"));\n";
            }

            finalString += "\t}\n";

            for (var thing in shadowsGenerator) {
                if (thing[0] === "_")
                    continue;

                var value = shadowsGenerator[thing];
                var result = "";

                if (typeof value === "number" || typeof value === "boolean") {
                    result += value;
                }
                else if (typeof value === "string") {
                    result += "\"" + value + "\"";
                }
                else
                    continue;

                finalString += "\tshadowGenerator." + thing + " = " + result + ";\n";
            }

            return finalString;
        }

        // Exports a BABYLON.Vector2
        private _exportVector2(vector: Vector2): string {
            return "new BABYLON.Vector2(" + vector.x + ", " + vector.y + ")";
        }

        // Exports a BABYLON.Vector3
        private _exportVector3(vector: Vector3): string {
            return "new BABYLON.Vector3(" + vector.x + ", " + vector.y + ", " + vector.z + ")";
        }

        // Exports a BABYLON.Quaternion
        private _exportQuaternion(quaternion: Quaternion): string {
            return "new BABYLON.Quaternion(" + quaternion.x + ", " + quaternion.y + ", " + quaternion.z + ", " + quaternion.w + ")";
        }

        // Exports a BABYLON.Color3
        private _exportColor3(color: Color3): string {
            return "new BABYLON.Color3(" + color.r + ", " + color.g + ", " + color.b + ")";
        }

        // Exports a BABYLON.Color4
        private _exportColor4(color: Color4): string {
            return "new BABYLON.Color4(" + color.r + ", " + color.g + ", " + color.b + ", " + color.a + ")";
        }

        // Traverses nodes
        private _traverseNodes(node?: Node): string {
            var scene = this.core.currentScene;

            if (!node) {
                var rootNodes: Node[] = [];
                var finalString = "";

                this._fillRootNodes(rootNodes, "meshes");
                this._fillRootNodes(rootNodes, "lights");

                for (var i = 0; i < rootNodes.length; i++) {
                    finalString += this._traverseNodes(rootNodes[i]);
                }

                return finalString;
            }
            else {
                var finalString = "";

                if (node.id.indexOf(EditorMain.DummyNodeID) === -1) {
                    finalString = "\t// Configure node " + node.name + "\n";

                    var foundParticleSystems = false;
                    for (var i = 0; i < scene.particleSystems.length; i++) {
                        var ps = scene.particleSystems[i];
                        if (ps.emitter === node) {
                            finalString += "\n" + this._exportParticleSystem(ps);
                            foundParticleSystems = true;
                        }
                    }

                    if (!foundParticleSystems)
                        finalString += "\tnode = scene.getNodeByName(\"" + node.name + "\");\n";

                    // Transformation
                    finalString += this._exportNodeTransform(node);

                    if (node instanceof AbstractMesh) {
                        // Material
                        if (node.material instanceof MultiMaterial) {
                            for (var i = 0; i < node.subMeshes.length; i++) {
                                finalString += this._exportNodeMaterial(node.subMeshes[i], i);
                            }
                        } else {
                            finalString += this._exportNodeMaterial(node);
                        }
                    }
                    else if (node instanceof Light) {
                        finalString += this._exportLight(node);
                    }
                }

                for (var i = 0; i < node.getDescendants().length; i++) {
                    finalString += this._traverseNodes(node.getDescendants()[i]);
                }

                return finalString;
            }

            // Should never happen
            return "";
        }

        // Fills array of root nodes
        private _fillRootNodes(data: Node[], propertyPath: string): void {
            var scene = this.core.currentScene;
            var nodes: Node[] = scene[propertyPath];

            for (var i = 0; i < nodes.length; i++) {
                if (!nodes[i].parent)
                    data.push(nodes[i]);
            }
        }
    }
}