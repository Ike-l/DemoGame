function main() {
    // unpack some constants
    const TriangleListShapes = CRAWLER_RENDERER.CONSTANTS.TriangleListShapes
    const TriangleListShapes2 = CRAWLER_RENDERER.CONSTANTS.TriangleListShapes2
    const LineListShapes = CRAWLER_RENDERER.CONSTANTS.LineListShapes
    const pLights = CRAWLER_RENDERER.CONSTANTS.LIGHTS.Point
    const sLights = CRAWLER_RENDERER.CONSTANTS.LIGHTS.Spot
    const dLights = CRAWLER_RENDERER.CONSTANTS.LIGHTS.Directional
    const Draw = CRAWLER_RENDERER.DRAW.Draw
    const Sphere = CRAWLER_RENDERER.SHAPES.THREED.Sphere
    const Material = CRAWLER_RENDERER.MATERIALS.Material
    // set the background colour
    CRAWLER_RENDERER.CONSTANTS.skyColour = { r: 0.1, g: 0.1, b: 0.1, a: 1 }
    //CRAWLER_RENDERER.CONSTANTS.skyColour = {r: 0.523, g: 0.808, b: 0.922, a: 1}
    // camera: UpdateVariableBuffers 

    // player with no restrictions
    class CreativePlayer extends CRAWLER_RENDERER.WORLD.Controller {
        constructor(parameters = {}) {
            super(parameters)
            this.BuildMode = false
            this.Inventory = {}
        }
        get BuildMode() {
            return this.buildMode
        }
        set BuildMode(bool) {
            this.buildMode = bool
        }
        get TempObject() {
            return this.tempObject
        }
        set TempObject(obj) {
            this.tempObject = obj
        }
        get ObjectTemplate() {
            return this.objectTemplate
        }
        set ObjectTemplate(objTemplate) {
            this.objectTemplate = objTemplate
        }
        // override some default behaviour
        EnableResize() {
            this.Camera.UpdateAspectRatio()
        }
        EnableWheel(evt) {
            this.Camera.Range += -evt.deltaY / 100
        }
        // add a keybind for 1 
        EnableDigit1(evt) {
            // only works when intensity 0 -> 1
            this.Camera.Torch.Intensity = 1 - this.Camera.Torch.Intensity
        }
        EnableDigit2() {
            this.ToggleBuildMode()
        }
        // add a keybind for 1 on numpad
        EnableNumpad1() {
            this.SwitchObject("Cube")
        }
        EnableNumpad2() {
            this.SwitchObject("Sphere")
        }
        EnableNumpad3() {
            this.SwitchObject("Cylinder")
        }
        EnableShiftRight() {
            // turns off all components visibility
            Object.values(CRAWLER_GAME_ENGINE.InterfaceComponents).forEach(x => {
                x.TurnCompletelyVisibility(false)
            })
        }
        EnableControlRight() {
            Object.values(CRAWLER_GAME_ENGINE.InterfaceComponents).forEach(x => {
            // turns on all components visibility
                x.TurnCompletelyVisibility(true)
                CRAWLER_GAME_ENGINE.InterfaceComponents.shapeRectangle._UpdateText()
            })
        }
        ToggleBuildMode() {
            this.BuildMode = !this.BuildMode
            if (this.TempObject) {
                if (this.BuildMode === false) {
                    this.DestroyObject()
                } else if (this.BuildMode === true) {
                    this.DisplayObject()
                }
            }
        }
        EnableClick(evt) {
            if (this.BuildMode && this.TempObject) {
                this.SaveObject()
                this.DestroyObject()
                this.TempObject = undefined
            } else {
                const minimumRadius = Math.min(...TriangleListShapes.map(object => object.HitBoxCubeDimension ? object.HitBoxCubeDimension : Infinity))
                for (let step = 0; step <= this.Camer.Range; step += minimumRadius / 100) {
                    const currentStepDistances = []
                    TriangleListShapes.forEach((shape, index) => {
                        const shapeCamDirectionVec = vec3.create()
                        vec3.subtract(shapeCamDirectionVec, shape.Position2, this.Camera.PositionInFront(step))
                        if (vec3.length(shapeCamDirectionVec) < shape.HitBoxCubeDimension) {
                            currentStepDistances.push([index, vec3.length(shapeCamDirectionVec) - shape.HitBoxCubeDimension])
                        }
                    })
                    if (currentStepDistances.length > 0) {
                        const closest = currentStepDistances.sort((a, b) => a[1] - b[1])[0]
                        const index = closest[0]
                        // "creative mode" do Infinite damage
                        TriangleListShapes[index]?.EnableClick(evt, {damage: Infinity})
                        return
                    }
                }
            }
        }
        SaveObject() {
            CRAWLER_RENDERER.CONSTANTS.TriangleListShapes.push(this.TempObject)
        }
        DisplayObject() {
            CRAWLER_RENDERER.CONSTANTS.TriangleListShapes2.push(this.TempObject)
        }
        CreateObject() {
            if (this.ObjectTemplate) {
                if (this.TempObject) {
                    this.DestroyObject()
                }
                this.TempObject = new this.ObjectTemplate.constructor({label: this.ObjectTemplate.label})
                if (this.BuildMode) {
                    this.DisplayObject()
                }
                return true
            } else {
                return false
            }
        }
        // shape exists or not
        // switch shape/
        // shape changes
        // array stays the same
        // build mode on/
        // build mode off/ 
        // -- shape is not destroyed somewhere here
        // -- i knew from debugging i was not removing when should have
        // -- was adding it twice
        // -- thought it was in the switch
        // -- changed it to check if build mode in the create object
        DestroyObject() {
            this.TempObject.Destroy(CRAWLER_RENDERER.CONSTANTS.TriangleListShapes2)
        }
        SwitchObject(object) {
            const oldTemplate = this.ObjectTemplate
            this.ObjectTemplate = CRAWLER_GAME_ENGINE.ShapeMapping[object]
            if (oldTemplate != this.ObjectTemplate) {
                if (this.TempObject) {
                    this.DestroyObject()
                }
                this.CreateObject()
            }
            console.log("render list when switching template:",CRAWLER_RENDERER.CONSTANTS.TriangleListShapes2)
        }
        UpdateTemporaryObject() {
            if (this.BuildMode) {
                const pos = this.Camera.PositionInFront(this.Camera.Range)
                if (!this.TempObject) {
                    const hasTemplate = this.CreateObject()
                    if (!hasTemplate) {
                        console.error("Provide a template using the keypad")
                        return
                    }
                }
    
                this.TempObject.Translation = pos
            }
        }
    }
    // player with limited building, cannot move vertically and uses tools to destroy
    class SurvivalPlayer extends CRAWLER_RENDERER.WORLD.Controller {
        constructor(parameters = {}) {
            super(parameters)
            this.BuildMode = false
            this.Inventory = {}
        }
        get Damage() {
            return this.Equipped?.Damage || 1
        }
        get BuildMode() {
            return this.buildMode
        }
        set BuildMode(bool) {
            this.buildMode = bool
        }
        get TempObject() {
            return this.tempObject
        }
        set TempObject(obj) {
            this.tempObject = obj
        }
        get ObjectTemplate() {
            return this.objectTemplate
        }
        set ObjectTemplate(objTemplate) {
            this.objectTemplate = objTemplate
        }
        EnableResize() {
            this.Camera.UpdateAspectRatio()
        }
        EnableKeyW(evt) {
            if (this.Focused) {
                // prevent horizontal moving
                const vec = this.Camera.ForwardVector
                vec[1] = 0
                this.Camera.Move(vec, 1)
            }
        }
        EnableKeyS(evt) {
            if (this.Focused) {
                // prevent horizontal moving
                const vec = this.Camera.ForwardVector
                vec[1] = 0
                this.Camera.Move(vec, -1)
            }
        }
        EnableSpace(evt) {
                // prevent horizontal moving
    
        }
        EnableShiftLeft(evt) {
                // prevent horizontal moving
    
        }
        EnableWheel(evt) {
            this.Camera.Range += -evt.deltaY / 100
        }
        EnableDigit1(evt) {
            // only works when intensity 0 -> 1
            this.Camera.Torch.Intensity = 1 - this.Camera.Torch.Intensity
        }
        EnableDigit2() {
            this.ToggleBuildMode()
        }
        EnableNumpad0() {
            if (this.Equipped == Tools.Axe) {
                this.Equipped = undefined
            } else {
                this.Equipped = Tools.Axe
            }
        }
        EnableNumpad1() {
            this.SwitchItem("Wood")
        }
        EnableNumpad2() {
            this.SwitchItem("Leaf")
        }
        EnableShiftRight() {
            Object.values(CRAWLER_GAME_ENGINE.InterfaceComponents).forEach(x => {
                x.TurnCompletelyVisibility(false)
            })
        }
        EnableKeyP() {
            const nonShapeComponents = [
               6, 7, 8, 9, 10, 11, 12, 
            ]
            Object.values(CRAWLER_GAME_ENGINE.InterfaceComponents).forEach((x, index) => {
                console.log(index)
                console.log(x)
            })
            // removes all shape components
            Object.values(CRAWLER_GAME_ENGINE.InterfaceComponents).forEach((x, index) => {
                if (nonShapeComponents.some(y => {
                    return y == index
                })) {
                    x.TurnCompletelyVisibility(false)
                }
            })
        }
        EnableControlRight() {
            Object.values(CRAWLER_GAME_ENGINE.InterfaceComponents).forEach(x => {
                x.TurnCompletelyVisibility(true)
                CRAWLER_GAME_ENGINE.InterfaceComponents.shapeRectangle._UpdateText()
            })
        }
        ToggleBuildMode() {
            this.BuildMode = !this.BuildMode
            console.log("Current buildmode:", this.BuildMode)
        }
        PlaceObject() {
            if (this.Item) {
                if (this.Item.count-- >= 0) {
                    CRAWLER_RENDERER.CONSTANTS.TriangleListShapes.push(new this.Item.item({label: "Placed", translation: this.Camera.PositionInFront(this.Camera.Range)}))
                    console.log("Item count:", this.Item.count)
                    if (this.Item.count == 0) {
                        this.Item = undefined
                    }
                }
            }
        }
        SwitchItem(type) {
            this.Item = this.Inventory[type]
            console.log("Current item:", this.Item?.item.name)
        }
        EnableClick(evt) {
            if (this.BuildMode && this.Item) {
                this.PlaceObject()
            } else {
                const minimumRadius = Math.min(...TriangleListShapes.map(object => object.HitBoxCubeDimension ? object.HitBoxCubeDimension : Infinity))
                for (let step = 0; step <= this.Camera.Range; step += minimumRadius / 100) {
                    const currentStepDistances = []
                    TriangleListShapes.forEach((shape, index) => {
                        const shapeCamDirectionVec = vec3.create()
                        vec3.subtract(shapeCamDirectionVec, shape.Position2, this.Camera.PositionInFront(step))
                        if (vec3.length(shapeCamDirectionVec) < shape.HitBoxCubeDimension) {
                            currentStepDistances.push([index, vec3.length(shapeCamDirectionVec) - shape.HitBoxCubeDimension])
                        }
                    })
                    if (currentStepDistances.length > 0) {
                        const closest = currentStepDistances.sort((a, b) => a[1] - b[1])[0]
                        const index = closest[0]
                        const destroyed = TriangleListShapes[index]?.EnableClick(evt, {damage: this.Damage})
                        if (destroyed) {
                            console.log("Destroyed object, inventory:", this.Inventory)
                        }
                        return
                    }
                }
            }
        }
    
    }
    function before(i, iterations, iterationsPerSecond) {
        if (player.constructor.name == "CreativePlayer") {
            player.UpdateTemporaryObject()
        }
        camera.Torch.Position = camera.LookingAt
        camera.Torch.Direction = camera.ForwardVector
        //camera.Torch.Intensity = Math.random()
    
        // if (i % iterationsPerSecond == 0) {
        //     camera.Torch.Colour = [Math.random(), Math.random(), Math.random()]
        // } 
    }
    function after(i, iterations, iterationsPerSecond) {
    }
    
    class Block extends CRAWLER_RENDERER.SHAPES.THREED.Cube {
        constructor(parameters = {}) {
            super(parameters) 
            this.Parent = parameters.parent
        }
        get Health() {
            return this.health
        }
        set Health(health) {
            this.health = health
        }
        EnableClick(evt, args = {}) {
            this.Health -= args.damage
            console.log(this.Health, this)
            if (this.Health <= 0) {
                this.PropogateEventClick()
                if (typeof player.Inventory[this.constructor.name] == "undefined") {
                    player.Inventory[this.constructor.name] = {count: 0, item: this.constructor}
                }
                player.Inventory[this.constructor.name].count ++
                console.log("Destroy:", this.Destroy)
                console.log("List:", CRAWLER_RENDERER.CONSTANTS.TriangleListShapes)
                this.Destroy(CRAWLER_RENDERER.CONSTANTS.TriangleListShapes)
                return true
            }
            return false
        }
        PropogateEventClick(evt) {
            this.Parent?.DestroyBlock(evt, {item: this, type: this.constructor.name})
        }
    }
    
    class Wood extends Block{
        constructor(parameters = {}) {
            parameters.label = "Wood"
    
            parameters.material = new CRAWLER_RENDERER.MATERIALS.Material({ambience: [0.65/4, 0.39/5, 0.27/8], shininess: 1, diffusivity: [0.65, 0.39, 0.27], specularity: [0, 0, 0]})
            super(parameters)
            this.Health = 5
        }
    }
    class Leaf extends Block{
        constructor(parameters = {}) {
            parameters.label = "Leaf"
            parameters.material = new CRAWLER_RENDERER.MATERIALS.Material({shininess: 256, diffusivity: [0.2, 0.8, 0.2], specularity: [0.2, 1, 0.2]})
            super(parameters)
            this.Health = 1
        }
    }
    
    class Tree {
        constructor(parameters = {}) {
            this.Blocks = []
            this.Wood = []
            this.Leaf = []
            this.TrunkLocations = [[0, 1, 0], [0, 2, 0], [0, 3, 0], [0, 4, 0]]
            this.LeafLocations = [[0, 5, 0], [1, 5, 0], [-1, 5, 0], [0, 5, 1], [0, 5, -1], [-1, 5, 1], [1, 5, 1], [-1, 5, -1], [1, 5, -1], [0, 6, 0]]
            this.Root = parameters.root
            this.Root.Parent = this
            this.Regenerate()
        }
        DestroyBlock(evt, args = {}) {
            const index = this[args.type].indexOf(args.item)
            // no negative indexing
            if (index >= 0) {
                this[args.type].splice(index, 1)
            }
        }
        Regenerate() {
            this.Wood.forEach((block, index) => {
                this.DestroyBlock(null, {item: block, type: "Wood"})
            })
            this.Leaf.forEach((block, index) => {
                this.DestroyBlock(null, {item: block, type: "Wood"})
            })
            this.Wood = [this.Root]
            this.Leaf = []
            for (let relativeLocation of this.TrunkLocations) {
                const position = relativeLocation.map((value, index) => {
                    return value + this.Root.Position2[index]
                })
                this.Wood.push(new Wood({parent: this, translation: position}))
            }
            for (let relativeLocation of this.LeafLocations) {
                const position = relativeLocation.map((value, index) => {
                    return value + this.Root.Position2[index]
                })
                this.Leaf.push(new Leaf({parent: this, translation: position}))
            }
            this.Blocks = this.Wood.concat(this.Leaf)
            //this.Blocks.shift()
            this.Blocks.forEach(block => {
                CRAWLER_RENDERER.CONSTANTS.TriangleListShapes.push(block)
            })
        }
    }
    
    class Tools {
        static Axe = { Damage: 3 }
    }
    window.camera = new CRAWLER_RENDERER.WORLD.Camera({ position: [0, 2, 0], lookingAt: [0, 2, 0], range: 5 })
    window.player = new CreativePlayer({ camera: camera })
    
    //dLights.push(new CRAWLER_RENDERER.LIGHTS.DIRECTIONAL.DefaultDirectionalLight({position: [1000, 1000, 0], colour: [0.523, 0.808, 0.922], intensity: 0.25, direction: [1, 1, 0]}))
    //TriangleListShapes.push(new CRAWLER_RENDERER.SHAPES.THREED.Sphere({label: "Sun", quality: 40, translation: [1000, 1000, 0], stretch: [100, 100, 100], material: new CRAWLER_RENDERER.MATERIALS.Material({shininess: 1, ambience: [1, 1, 1]})}))
    
    sLights.push(new CRAWLER_RENDERER.LIGHTS.SPOT.DefaultSpotLight({ label: "Torch", position: camera.LookingAt, colour: [0.3, 0.3, 0.3], intensity: 1, direction: camera.ForwardVector, outerCone: 0.9, innerCone: 0.99 }))
    pLights.push(new CRAWLER_RENDERER.LIGHTS.POINT.DefaultPointLight({ label: "Point", position: [1, 1, 0], colour: [1, 0.5, 0], intensity: 1, attenuation: [1, 0.01, 0.0025] }))
    camera.Torch = sLights[0]
    
    

    const root = new Wood({translation: [3, 1, 3]})
    window.tree = new Tree({root: root})
    
    const root1 = new Wood({translation: [-3, 1, 3]})
    const tree1 = new Tree({root: root1})
    
    const root2 = new Wood({translation: [3, 1, -3]})
    const tree2 = new Tree({root: root2})
    
    TriangleListShapes.push(new CRAWLER_RENDERER.SHAPES.THREED.Cube({
        label: "FirstObject",
        translation: [1, 2, 3],
    }))
    TriangleListShapes.push(new CRAWLER_RENDERER.SHAPES.THREED.Cube({
        label: "SecondObject",
        translation: [3, 2, 1],
    }))
    
    
    
    
    
    TriangleListShapes.push(new CRAWLER_RENDERER.SHAPES.TWOD.Plane({ stretch: [100, 1, 100], label: "Floor", material: new CRAWLER_RENDERER.MATERIALS.Material({ shininess: 1, diffusivity: [0, 0, 2], ambience: [0, 0, 0] }) }))
    CRAWLER_GAME_ENGINE.InterfaceComponents.shapeRectangle._UpdateText()
    CRAWLER_GAME_ENGINE.InterfaceComponents.lightRectangle._UpdateText()
    //TriangleListShapes2.push(new CRAWLER_RENDERER.SHAPES.THREED.Cube({ translation: [1, 1, 1], label: "Cube"}) )
    // for the create shapes, my custom templates but its just a mapping
    CRAWLER_GAME_ENGINE.ShapeMapping = {
        "Cube": {
            constructor: CRAWLER_RENDERER.SHAPES.THREED.Cube,
            label: "Cube"
        }, "Sphere": {
            constructor: CRAWLER_RENDERER.SHAPES.THREED.Sphere,
            label: "Sphere"
        }, "Cylinder": {
            constructor: CRAWLER_RENDERER.SHAPES.THREED.Cylinder,
            label: "Cylinder"
        }, "Plane": {
            constructor: CRAWLER_RENDERER.SHAPES.TWOD.Plane,
            label: "Plane"
        }, "Circle": {
            constructor: CRAWLER_RENDERER.SHAPES.TWOD.Circle,
            label: "Circle"
        },
    }
    CRAWLER_GAME_ENGINE.Interface.UpdateCreateTool()
    
    
    
    CRAWLER_INTERFACE.UTILITY.Utility.Loop(Draw, Infinity, true, before, after)
}

let repeat = setInterval(() => {
    // used typeof so no error is thrown
        if (typeof CRAWLER_RENDERER != "undefined") {
            if (CRAWLER_RENDERER.CONSTANTS != undefined) {
                clearInterval(repeat)
                main()
                console.log("Loaded")
            } 
        }
}, 50)