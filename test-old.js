// Get Canvas
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

// Primitives

var aPrimitive = {

    addtobuffer: function () {console.log("drawing method not defined")},

    init: function (name, points, color) {
        this.name = name;
        this.color = color || "orange";
        this.points = points;
        this.points.x = this.points.x || 0;
        this.points.y = this.points.y || 0;
    },

    addChildren: function (childrenArray) {
        this.childParts = [];
        childrenArray.forEach(function(anitem){
            this.addAChild(anitem);
        }, this);
    },


    addAChild: function (childParamsArray) {
        var childitem = Object.create(childParamsArray[0]);
        childitem.points.x = childitem.points.x + this.points.width * childParamsArray[1 ].x;
        childitem.points.y = childitem.points.y + this.points.height * childParamsArray[1 ].y;
        this.childParts.push(childitem);

        if(childParamsArray.slice(-1)[0].length) {
            console.log( "will add children", this.name );
            childitem.addChildren.call(childitem, childParamsArray.slice(-1)[0]);
        }

    },

    drawchildren: function () {
        this.childParts.forEach( function ( achild ) {
            achild.addtobuffer();
            if(achild.childParts && achild.childParts.length){
                achild.drawchildren();
            }
        } );
    }



};

// Base shapes

var aRectangle = Object.create(aPrimitive);
aRectangle.addtobuffer = function () {
    console.log( "will add to draw buffer", this.name );
    ctx.beginPath();
    ctx.strokeStyle = this.color;
    ctx.rect(this.points.x, this.points.y, this.points.width, this.points.height);
    ctx.stroke();
};

var aCircle = Object.create(aPrimitive);
aCircle.addtobuffer = function () {
    ctx.ellipse(0, 0, this.points.radiusX, this.points.radiusY, 0, 2 * Math.PI);
};


// Body Building Blocks

var DragonBody = Object.create(aRectangle);
DragonBody.init("DragonBody", {width: 100, height: 50});

var Leg1 = Object.create(aRectangle);
Leg1.init("Leg1", {width: 50, height: 100}, 'blue');

var Leg2 = Object.create(aRectangle);
Leg2.init("Leg2", {width: 100, height: 120}, 'red');

var Leg3 = Object.create(aRectangle);
Leg3.init("Leg3", {width: 40, height: 120}, 'green');


// Dragon Structure

//var DragonStructure = [
//        [
//            Leg1, {x:0.5, y:1}, 30, 1.2, [
//                [
//                    Leg2, {x:0.5, y:1}, 0, 1, [
//                    [
//                        Leg3, {x:0.5, y:1}, 0, 1, []
//                    ]
//                ]
//                ],
//                [
//                    Leg2, {x:0.5, y:1}, 0, 1, []
//                ]
//            ]
//        ],
//        [
//            Leg1, {x:1, y:0.5}, 40, 0.8, []
//        ]
//
//
//];

var DragonStructure = [
    [
        Leg1, {x:0.5, y:1}, 30, 1.2, [
        [
            Leg2, {x:0, y:0}, 0, 1, []
        ],
        [
            Leg2, {x:1, y:2}, 0, 1, []
        ]
    ]
    ]


];

// Logic to draw the Dragon

DragonBody.addChildren(DragonStructure);

DragonBody.addtobuffer();
DragonBody.drawchildren();
//buildJoints(MyDragon.Parts);

//ctx.strokeStyle = "#0000FF";
//ctx.stroke();

console.log("hello reload");




