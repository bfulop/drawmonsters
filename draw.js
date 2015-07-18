"use strict";

// Get Canvas
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

ctx.translate(100, 100);
ctx.fillStyle = "orange";


// Base object

var bodypart = {

    init : function (name, width, height) {
      this.name = name;
      this.width = width;
      this.height = height;
    }

};

bodypart.addjoint = function addjointbodypart (childobj) {
    // childobj = {x:1, y:1, scale:1, rotation:{current:0, start:45, min:0, max:90, duration:5000}, elem:leg1}
    var newjoint = {
        offsetx   : this.width * childobj.x,
        offsety   : this.height * childobj.y,
        scale     : childobj.scale,
        rotation  : childobj.rotation,
        childelem : Object.create( childobj.elem )
    };
//    adjust the rotation parameter
    newjoint.rotation.current = childobj.rotation.start;
    newjoint.rotation.range = childobj.rotation.max - childobj.rotation.min;
    newjoint.rotation.timeoffset = (newjoint.rotation.range / childobj.rotation.duration) * (childobj.rotation.start - childobj.rotation.min);

    if (this.parentelem) {
        newjoint.rotation.cumulated = this.parentelem.joints[this.jointindex ].rotation.current + newjoint.rotation.current;
    } else {
        newjoint.rotation.cumulated = newjoint.rotation.current;
    }

    if ( !this.hasOwnProperty( 'joints' ) ) {
        this.joints = [];
    }

    newjoint.childelem.parentelem = this;
    newjoint.childelem.jointindex = this.joints.length;

    this.joints.push( newjoint );

//    newjoint.parentjoint = this.joints[this.joints.length - 1];

    return newjoint.childelem;
};

bodypart.update = function updatebodypart (childobj, index) {
    if (!this.joints || !this.joints[index]) {
        return this.addjoint(childobj);
    } else {
        this.joints[index ].offsetx = this.width * childobj.x;
        this.joints[index ].offsety = this.height * childobj.y;
        return this.joints[index ].childelem;
    }
};

bodypart.render = function renderbodypart () {
    ctx.save();
  ctx.rect(0,0,this.width,this.height);
  if(this.joints) {
      this.joints.forEach( function ( elem ) {
          ctx.save();
          ctx.translate( elem.offsetx, elem.offsety );
          ctx.rotate(Math.PI/180 * elem.rotation.current);
          elem.childelem.render();
          ctx.restore();
      }, this );
  }
    ctx.restore();

};

// animate child elements rotation based on elapsed time
bodypart.animate = function animatebodypart (elapsedtime) {
    if(this.joints) {
        this.joints.forEach(function(ajoint){
            if(ajoint.rotation.duration) {
                ajoint.rotation.current = ajoint.rotation.min + cycler(((elapsedtime + ajoint.rotation.timeoffset) % ajoint.rotation.duration)/ajoint.rotation.duration) * (ajoint.rotation.max - ajoint.rotation.min);
            }
            if(ajoint.childelem.joints){
                ajoint.childelem.animate(elapsedtime);
            }
        }, this);
    }
};

function cycler (input) {
//    input: 0...1, output: 0...1...0
    return Math.sin((input * 180) * (Math.PI/180.0));
}

var mainbody = Object.create(bodypart);
mainbody.init("mainbody", 200, 100);

var Leg1 = Object.create(bodypart);
Leg1.init("leg1", 50, 110);

var Leg2 = Object.create(bodypart);
Leg2.init("leg2", 60, 30);
//
//mainbody.addjoint({
//  x: 0.5,
//  y: 1,
//  scale: 1,
//  rotation: 0,
//  elem: Leg1
//});
//
//mainbody.addjoint({
//  x: 0,
//  y: 1,
//  scale: 1,
//  rotation: 0,
//  elem: Leg2
//});
//
//mainbody.addjoint.call(mainbody.joints[0].childelem,{
//  x: 0.5,
//  y: 1,
//  scale: 1,
//  rotation: 0,
//  elem: Leg2
//});


/////////////////////////////////////////////

var mymonster = [
    {
        x        : 0.2,
        y        : 0.8,
        scale    : 1,
        rotation : { start : 60, min : 60, max : 90, duration : 7000 },
        elem     : Leg1,
        joints   : [
            {
                x        : 0.6,
                y        : 1.1,
                scale    : 1,
                rotation : { start : -100, min : -100, max : -130, duration : 7000 },
                elem     : Leg1,
                joints   : [
                    {
                        x        : 0.4,
                        y        : 0.8,
                        scale    : 1,
                        rotation : { start : 20, min : 20, max : 45, duration : 7000 },
                        elem     : Leg2,
                        joints   : []
                    }

                ]
            }

        ]
    },
    {
        x        : 0.8,
        y        : 1,
        scale    : 1,
        rotation : { start : 0 },
        elem     : Leg1,
        joints   : [
            {
                x        : 0,
                y        : 1,
                scale    : 1,
                rotation : { start : 0 },
                elem     : Leg1,
                joints   : [
                    {
                        x        : 0.5,
                        y        : 1,
                        scale    : 1,
                        rotation : { start : 45 },
                        elem     : Leg1,
                        joints   : []
                    }

                ]
            },
            {
                x        : -0.5,
                y        : 0.5,
                scale    : 1,
                rotation : { start : 10 },
                elem     : Leg2,
                joints   : []
            }

        ]
    }
];

function addjoints (parentobj, childobj, index) {
  var childelem = {
    x: childobj.x,
    y: childobj.y,
    scale: childobj.scale,
    rotation: childobj.rotation,
    elem: childobj.elem
  };
    var indexnumber = index || 0;

  var newchild = parentobj.update(childelem, indexnumber);
  childobj.joints.forEach(function addachildjoint(achildelem, index){
    addjoints(newchild, achildelem, index);
  });
}

mymonster.forEach( function processjoints ( abodypart, index ) {
    addjoints(mainbody, abodypart, index);
});



mainbody.render();

ctx.fill();

function updatedata() {
    mymonster.forEach( function processjoints ( abodypart, index ) {
        addjoints(mainbody, abodypart, index);
    });

//    ctx.clearRect(-100, -100, 500, 400);
//    ctx.fillStyle = "red";
//    ctx.beginPath();
//
//    mainbody.render();
//    ctx.fill();
}

var starttime = null;
var elapsedtime = 0;

function moveanimal(timestamp) {
    if (!starttime) {
        starttime = timestamp;
    }

    elapsedtime = timestamp - starttime;

//    updatedata();

    mainbody.animate(elapsedtime);

    ctx.clearRect(-100, -100, 500, 400);
    ctx.beginPath();

    mainbody.render();
    ctx.fill();

    window.requestAnimationFrame(moveanimal);

}

// moveanimal();


/////////////////////////////////////////////
///// INVERSE KINEMATICS  ///////////////////
/////////////////////////////////////////////



function getRotatedPosition (startx, starty, length, startrotation, rotation) {
    var newpositions = {};
    var deltax, deltay;

    if (startrotation + rotation < 45 ) {
        deltax = Math.sin(startrotation + rotation * Math.PI/180) * length;
        deltay = Math.cos(startrotation + rotation * Math.PI/180) * length;
    } else {
        deltax = Math.cos(startrotation + rotation * Math.PI/180) * length;
        deltay = Math.sin(startrotation + rotation * Math.PI/180) * length;

    }
    newpositions.x = startx + deltax;
    newpositions.y = starty + deltay;
    return newpositions;

}

















