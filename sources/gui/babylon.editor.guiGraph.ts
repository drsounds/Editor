﻿module BABYLON.EDITOR.GUI {
    export class GUIGraph extends GUIElement implements IGraphElement {
        // Public members
        public menus: Array<IGraphMenuElement> = new Array<IGraphNodeElement>();

        /**
        * Constructor
        * @param name: the form name
        * @param header: form's header text
        */
        constructor(name: string) {
            super(name);
        }

        public addMenu(id: string, text: string, img: string = ""): void {
            this.menus.push({
                id: id,
                text: text,
                img: img
            });
        }
        
        // Creates a new node and returns its reference
        public createNode(id: string, text: string, img: string = "", data?: Object): IGraphNodeElement {
            return {
                id: id,
                text: text,
                img: img,
                data: data
            };
        }

        // Adds new nodes to the graph
        public addNodes(nodes: IGraphNodeElement[] | IGraphNodeElement, parent?: string): void {
            var element = <W2UI.IGraphElement>this.element;

            if (!parent)
                element.add(Array.isArray(nodes) ? nodes : [nodes]);
            else
                element.add(parent, Array.isArray(nodes) ? nodes : [nodes]);
        }
        
        // Removes the provided node
        public removeNode(node: IGraphNodeElement): void {
            (<W2UI.IGraphElement>this.element).remove(node);
        }
        
        // Sets if the provided node is expanded or not
        public setNodeExpanded(node: string, expanded: boolean): void {
            var element = <W2UI.IGraphElement>this.element;
            expanded ? element.expand(node) : element.collapse(node);
        }

        // Sets the selected node
        public setSelected(node: IGraphNodeElement): void {
            var element = (<W2UI.IGraphElement>this.element).get(node);

            while (element.parent != null) {
                element = element.parent;
                element.expanded = true;
            }

            (<W2UI.IGraphElement>this.element).select(node);
        }

        // Returns the selected node
        public getSelected(): IGraphNodeElement {
            return (<W2UI.IGraphElement>this.element).selected;
        }

        // Clears the graph
        public clear(): void {
            var toRemove = [];
            var element = <W2UI.IGraphElement>this.element;

            for (var i = 0; i < element.nodes.length; i++)
                toRemove.push(element.nodes[i].id);

            element.remove.apply(element, toRemove);
        }

        // Build element
        public buildElement(parent: string): void {
            this.element = (<any>$("#" + parent)).w2sidebar({
                name: this.name,
                img: null,
                keyboard: false,
                nodes: [],
                menu: this.menus,
                onClick: (event: Event) => {

                },
                onMenuClick: (event: Event) => {

                }
            });
        }
    }
}