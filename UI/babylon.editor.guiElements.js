﻿/// <reference path="../index.html" />

/// Extends
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};

var BABYLON;
(function (BABYLON) { /// namespace BABYLON
var Editor;
(function (Editor) { /// namespace Editor

    var GUIElement = (function () {

        function GUIElement(name, core) {
            this.name = name;
            this._core = core;
            this.element = null;
        }

        /// Refresh the element if needed
        GUIElement.prototype.refresh = function () {
            this.element.refresh();
        }

        /// Destroy the element
        GUIElement.prototype.destroy = function () {
            this.element.destroy();
        }

        /// Add event
        GUIElement.prototype.on = function (event, callback) {
            this.element.on({ type: event, execute: 'after' }, function (target, eventData) {
                callback();
            });
        }

        /// Builds the w2ui element
        GUIElement.prototype.buildElement = function (parent) { return null; }

        return GUIElement;

    })();

    var GUILayout = (function (_super) {
        ///Panel
        __extends(GUIPanel, _super);
        function GUIPanel(name, core, type, size, resizable) {
            _super.call(this, name, core);
            /// Members
            this.tabs = new Array();
            this.id = name + '.id';
            this.type = type;
            this.size = (size == null) ? 150 : size;
            this.resizable = (resizable == null) ? false : resizable;
            this.minSize = 10;
            this.maxSize = false;
            this.style = BabylonEditorUICreator.Layout.Style;
            this.content = '';
        }

        GUIPanel.prototype.createTab = function (id, caption) {
            this.tabs.push({ id: id, caption: caption });
            return this;
        }
        GUIPanel.prototype.removeTab = function (id) {
            for (var i = 0; i < this.tabs.length; i++) {
                if (this.tabs[i].id == id) {
                    this.tabs.splice(i, 1);
                    return true;
                }
            }
            return false;
        }
        GUIPanel.prototype.setTabEnabled = function(tab, enable) {
            enable ? this._panelElement.tabs.enable(tab) : this._panelElement.tabs.disable(tab);
            return this;
        }
        GUIPanel.prototype.getTabIDFromIndex = function (index) {
            if (index >= 0 && index < this.tabs.length)
                return this.tabs[index].id;
            else
                return 'null';
        }

        GUIPanel.prototype.setContent = function (content) {
            this.content = content;
            return this;
        }
        GUIPanel.prototype.buildElement = function (parent) {
            this.element = {
                type: this.type,
                size: this.size,
                resizable: this.resizable,
                style: this.style,
                content: this.content,
                minSize: this.minSize,
                maxSize: this.maxSize,
            };

            if (this.tabs.length > 0) {
                var scope = this;
                this.element.tabs = {
                    active: this.tabs[0],
                    tabs: this.tabs,
                    onClick: function (event) {
                        var ev = new BABYLON.Editor.Event();
                        ev.eventType = BABYLON.Editor.EventType.GUIEvent;
                        ev.event = new BABYLON.Editor.Event.GUIEvent();
                        ev.event.eventType = BABYLON.Editor.Event.GUIEvent.TAB_CHANGED;
                        ev.event.caller = scope;
                        ev.event.result = event.target;
                        scope._core.sendEvent(ev);
                    }
                }
            }

            return this;
        }

        /// Layout
        __extends(GUILayout, _super);
        function GUILayout(name, core) {
            _super.call(this, name, core);
            ///Members
            this.panels = new Array();
        }
        GUILayout.prototype.createPanel = function (id, type, size, resizable) {
            var panel = new GUIPanel(id, this._core, type, size, resizable);
            this.panels.push(panel);
            return this.panels[this.panels.length - 1];
        }

        GUILayout.prototype.getPanelFromType = function (type) {
            for (var i = 0; i < this.panels.length; i++) {
                if (this.panels[i].type == type)
                    return this.panels[i];
            }
            return null;
        }
        GUILayout.prototype.getPanelFromName = function (name) {
            for (var i = 0; i < this.panels.length; i++) {
                if (this.panels[i].name == name)
                    return this.panels[i];
            }
            return null;
        }
        GUILayout.prototype.getPanelFromID = function (id) {
            for (var i = 0; i < this.panels.length; i++) {
                if (this.panels[i].id == id)
                    return this.panels[i];
            }
            return null;
        }

        GUIElement.prototype.buildElement = function (parent) {
            var datas = new Array();
            for (var i = 0; i < this.panels.length; i++) {
                if (this.panels[i].element == null)
                    this.panels[i].buildElement();
                datas.push(this.panels[i].element);
            }

            this.element = $('#' + parent).w2layout({
                name: this.name,
                panels: datas
            });

            for (var i = 0; i < this.panels.length; i++) {
                this.panels[i]._panelElement = this.element.get(this.panels[i].type);
            }

            return this;
        }


        return GUILayout;

    })(GUIElement);

    var GUIToolbar = (function (_super) {
        /// Items
        function GUIToolbarItem(type, id, text, icon) {
            this.type = type;
            this.id = id;
            this.text = (text == null) ? '' : text;
            this.icon = (icon == null) ? '' : icon;

            this.element = null;
        }
        GUIToolbarItem.prototype.create = function () {
            this.element = { type: this.type, id: this.id, text: this.text, icon: this.icon };
        }

        /// Menus
        function GUIToolbarMenu(type, id, text, icon) {
            this.items = new Array();
            this.type = type;
            this.id = id;
            this.text = (text == null) ? '' : text;
            this.icon = (icon == null) ? '' : icon;
            this.ckeched = false;

            this.element = null;
        }
        GUIToolbarMenu.prototype.createItem = function (type, name, text, icon) {
            var item = new GUIToolbarItem(type, name, text, icon);
            this.items.push(item);
            return this.items[this.items.length - 1];
        }
        GUIToolbarMenu.prototype.create = function () {
            var items = new Array();
            for (var i = 0; i < this.items.length; i++) {
                this.items[i].create();
                items.push(this.items[i].element);
            }
            this.element = { type: this.type, id: this.id, caption: this.text, img: this.icon, checked: this.ckeched, items: items };
        }
        
        /// Toolbar
        __extends(GUIToolbar, _super);
        function GUIToolbar(name, core) {
            _super.call(this, name, core);
            /// Members
            this.items = new Array();
        }

        GUIToolbar.prototype.createMenu = function(type, id, text, icon) {
            var menu = new GUIToolbarMenu(type, id, text, icon);
            this.items.push(menu);
            return this.items[this.items.length - 1];
        }

        GUIToolbar.prototype.setItemChecked = function (item, check) {
            if (check)
                this.element.check(item);
            else
                this.element.uncheck(item);
        }

        GUIToolbar.prototype.isItemChecked = function (item) {
            return this.element.get(item).checked;
        }

        GUIToolbar.prototype.setAutoItemChecked = function (item) {
            var checked = this.element.get(item).checked;
            if (!checked)
                this.element.check(item);
            else
                this.element.uncheck(item);
        }

        GUIToolbar.prototype.buildElement = function (parent) {
            var items = new Array();
            for (var i = 0; i < this.items.length; i++) {
                this.items[i].create();
                items.push(this.items[i].element);
            }

            var scope = this;
            this.element = $('#' + parent).w2toolbar({
                name: this.name,
                items: items,
                onClick: function (event) {
                    /// Send the click event to event receivers
                    var ev = new BABYLON.Editor.Event();
                    ev.eventType = BABYLON.Editor.EventType.GUIEvent;
                    ev.event = new BABYLON.Editor.Event.GUIEvent();
                    ev.event.eventType = BABYLON.Editor.Event.GUIEvent.TOOLBAR_SELECTED;
                    ev.event.caller = scope;
                    ev.event.result = event.target;
                    scope._core.sendEvent(ev);
                }
            });

            return this;
        }

        return GUIToolbar;

    })(GUIElement);

    var GUISidebar = (function (_super) {
        __extends(GUISidebar, _super);
        function GUISidebar(name, core) {
            _super.call(this, name, core);
        }

        GUISidebar.prototype.createNode = function (id, text, img, data) {
            return { id: id, text: text, img: img, data: data };
        }
        GUISidebar.prototype.addNodes = function (nodes, parent) {
            if (parent == null)
                this.element.add(nodes);
            else
                this.element.add(parent, nodes);
        }
        GUISidebar.prototype.removeNode = function (node) {
            this.element.remove(node);
        }
        GUISidebar.prototype.setNodeExpanded = function (node, expanded) {
            expanded ? this.element.expand(node) : this.element.collapse(node);
        }

        GUISidebar.prototype.setSelected = function (node) {
            var element = this.element.get(node);
            while (element.parent != null) {
                element = element.parent;
                element.expanded = true;
            }

            this.element.select(node);
        }

        GUISidebar.prototype.clear = function () {
            var toRemove = [];
            for (var i = 0; i < this.element.nodes.length; i++) {
                toRemove.push(this.element.nodes[i].id);
            }
            this.element.remove.apply(this.element, toRemove);
        }

        GUISidebar.prototype.buildElement = function (parent) {
            var scope = this;
            this.element = $('#' + parent).w2sidebar({
                name: this.name,
                img: null,
                keyboard: false,
                nodes: [],
                onClick: function (event) {
                    /// Send the ObjectPicked event to the event receivers
                    /// Must be extern
                    var ev = new BABYLON.Editor.Event();
                    ev.eventType = BABYLON.Editor.EventType.SceneEvent;
                    ev.event = new BABYLON.Editor.Event.SceneEvent();
                    ev.event.eventType = BABYLON.Editor.Event.SceneEvent.OBJECT_PICKED;
                    ev.event.object = event.object.data;
                    scope._core.sendEvent(ev);
                }
            });

            return this;
        }

        /// Statics & utils
        GUISidebar.UpdateSidebarFromObject = function (sidebar, object) {
            var element = sidebar.element.get(object.id);
            element.text = element.data.name;
            if (object.parent != null)
                element.parent = sidebar.element.get(object.parent.id);
            sidebar.element.refresh();
        }

        return GUISidebar;

    })(GUIElement);

    BABYLON.Editor.GUIElement = GUIElement;
    BABYLON.Editor.GUILayout = GUILayout;
    BABYLON.Editor.GUIToolbar = GUIToolbar;
    BABYLON.Editor.GUISidebar = GUISidebar;

})(BABYLON.Editor || (BABYLON.Editor = {})); /// End namespace Editor
})(BABYLON || (BABYLON = {})); /// End namespace BABYLON