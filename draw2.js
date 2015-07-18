"use strict";

// Get Canvas
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

ctx.strokeStyle = "orange";
ctx.lineWidth = 2;

// monsterstructure obj is only used for debugging
var monsterstructure = {};

var bodypart = {

    setparam : function (paramobj) {
        this[paramobj.paramname] = paramobj.paramvalue;

        if (paramobj.paramname === "parentobj") {
            this.addparent(paramobj.paramvalue);
        }
    },

    addparent : function (parentobj) {
        this.parentobj = parentobj;
        this.setabsposition(parentobj.abscoordinates);
        this.addchild.call(this.parentobj,this);
    },

    addchild : function (childobj) {
        if ( !this.hasOwnProperty( 'children' ) ) {
            this.children = [];
        }
        this.children.push(childobj);
    },

    setabsposition : function (parentcoordsobj) {
        this.abscoordinates          = {};
        this.abscoordinates.startx   = parentcoordsobj.endx;
        this.abscoordinates.starty   = parentcoordsobj.endy;
        this.abscoordinates.rotation = parentcoordsobj.rotation + this.rotation;
        this.abscoordinates.deltax   = this.length * (Math.sin(this.abscoordinates.rotation * Math.PI/180));
        this.abscoordinates.deltay   = this.length * (Math.cos(this.abscoordinates.rotation * Math.PI/180));
        this.abscoordinates.endx     = this.abscoordinates.startx + this.abscoordinates.deltax;
        this.abscoordinates.endy     = this.abscoordinates.starty + this.abscoordinates.deltay;
    },

    render : function () {
        ctx.save();
        ctx.beginPath();
        ctx.lineWidth = this.width;
        ctx.moveTo(this.abscoordinates.startx, this.abscoordinates.starty);
        ctx.lineTo(this.abscoordinates.endx, this.abscoordinates.endy);
        ctx.stroke();
        ctx.restore();

        if (this.children) {
            this.children.forEach(function (achild) {
                achild.render();
            });
        }

        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = "black";
        ctx.arc(this.abscoordinates.endx, this.abscoordinates.endy, 4, 0, 2*Math.PI);
        ctx.stroke();
        ctx.restore();

     },

    updatemonsterstructure : function () {
        monsterstructure[ this.name ] = this;
    },

    update : function (newparamsobj) {
        var aparam;
        var needupdate = false;
        for (aparam in newparamsobj) {
            if(!this[aparam] || this[aparam] != newparamsobj[aparam]) {
                needupdate = true;
                this.setparam({paramname: aparam, paramvalue: newparamsobj[aparam]});
            }
        }

        if ( needupdate ) {
//            update absolute coordinates
            if ( this.parentobj ) {
                this.setabsposition( this.parentobj.abscoordinates );
            }
//            update children's coordinates
            if ( this.children ) { this.updatechildren(); }

        }

        if (needupdate && this.abscoordinates) {
//            ctx.clearRect(0, 0, 500, 400);
            ctx.fillStyle = "rgba(250, 250, 250, 0.4)";

            ctx.fillRect (0, 0, 500, 400);
            ctx.beginPath();

            BodyStart.render();
            ctx.stroke();
        }
    },

    updatechildren : function () {
        this.children.forEach( function ( achild ) {
            this.setabsposition.call( achild, this.abscoordinates );
            if (achild.children) {
                this.updatechildren.call(achild, null);
            }
        }, this );

    }

};


var BodyStart = Object.create(bodypart);
BodyStart.update({name:"BodyStart", length: 40, width: 10, rotation: 0});
BodyStart.setabsposition({endx: 100, endy: 50, rotation: 45});


var Leg1 = Object.create(bodypart);
Leg1.update({name:"Leg1", length: 100, width: 20, rotation: -10, parentobj:BodyStart});


var Leg1Joint1 = Object.create(bodypart);
Leg1Joint1.update({name:"Leg1Joint1", length: 140, width: 15, rotation: -10, parentobj:Leg1});

var Leg1Joint1Joint1 = Object.create(bodypart);
Leg1Joint1Joint1.update({name:"Leg1Joint1Joint1", length: 220, width: 10, rotation: 110, parentobj:Leg1Joint1});

BodyStart.render();
ctx.stroke();


//Leg1.update({rotation: -50});

////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////
//  inverse kinematics solver
////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////

bodypart.endJointSolver = function (posobj) {

    var movedistance, moverotation;

    movedistance = pointsdistance(posobj, {x : this.parentobj.abscoordinates.endx, y : this.parentobj.abscoordinates.endy});
    moverotation = Math.asin(this.length / (movedistance / 2));

    return moverotation;


    function pointsdistance (posA, posB) {
        var dx, dy, distance;

        dx = Math.abs(posA.x - posB.x);
        dy = Math.abs(posA.y - posB.y);
        distance = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));

        return distance;

    }

};


bodypart.twoJointSolver = function (posobj) {

//    get rotation direction
    var clockwise = clockwiseBol(
         {
             x : this.parentobj.abscoordinates.startx,
             y : this.parentobj.abscoordinates.starty
         },
         {
             x : this.parentobj.abscoordinates.endx,
             y : this.parentobj.abscoordinates.endy
         },
        posobj
    );

    console.log( "clockwise?", clockwise );


//    getParentRotation

    var dist_parent_target = getDistance(
        {
            x : this.parentobj.abscoordinates.startx,
            y : this.parentobj.abscoordinates.starty
        },
        {
            x : posobj.x,
            y : posobj.y
        }
    );

    var angle_parent_target = getAngleatCorner(dist_parent_target, this.parentobj.length, this.length);

    var dist_end_target = getDistance(
        {
            x : this.abscoordinates.startx,
            y : this.abscoordinates.starty
        },
        {
            x : posobj.x,
            y : posobj.y
        }
    );

    var angle_end_target = getAngleatCorner(dist_parent_target, this.parentobj.length, dist_end_target);

    var targetangle = angle_end_target + angle_parent_target;

//    if target is behind then
//    var targetangle = angle_end_target + angle_parent_target;


//    getEndPointRotation

    var angle_endjoint_target = getAngleatCorner(this.parentobj.length, this.length, dist_parent_target);

    var endjoint_rotation = getAnglebySines(angle_parent_target, this.length, dist_parent_target);

    return({
        parentobj        : this.parentobj,
        parentortation   : this.parentobj.rotation - targetangle,
        endrotation      : 180 - angle_endjoint_target,
        endjointrotation : 180 - endjoint_rotation
    });

    function getDistance (startpos, endpos) {
        var sidex = Math.abs(startpos.x - endpos.x);
        var sidey = Math.abs(startpos.y - endpos.y);
        return Math.sqrt(Math.pow(sidex, 2) + Math.pow(sidey, 2));
    }

    function getAngleatCorner (righttoangle, leftoangle, oppositetoangle) {
        var targetangle;
        var sortedsides = [ righttoangle, leftoangle, oppositetoangle ].sort(function(a,b){
            return b - a;
        });


        var largestangle = Math.acos((Math.pow(sortedsides[1], 2) + Math.pow(sortedsides[2], 2) - Math.pow(sortedsides[0], 2)) / (2 * sortedsides[1] * sortedsides[2]));

        if ( oppositetoangle === sortedsides[0] ) {
            return largestangle / (Math.PI / 180);
        } else {
            targetangle = (oppositetoangle / sortedsides[0]) * Math.sin(largestangle);
            targetangle = Math.asin(targetangle);
            return (targetangle / (Math.PI/180));
        }
    }

    function getAnglebySines (angle_at_left, distance_at_right, distance_opposite) {
        var targetangle;
//        distance_at_right / sin(angle_at_left) = distance_opposite / sin(targetangle)

//        sin(targetangle =

//        sine(targetangle) / sine(angle_at_left) = distance_opposite / distance_at_right
        targetangle = (distance_opposite / distance_at_right) * Math.sin(angle_at_left * (Math.PI / 180));
        targetangle = Math.asin(targetangle);
        return (targetangle / (Math.PI / 180));

    }

    function clockwiseBol (startpoint, endpoint, targetpoint) {
//        1. get a normalised triangle
        var sortedpoints = [startpoint, endpoint ].sort(function(a,b){
//            largest first
            return b.x - a.x;
        });
//        2. get the base triangle we're comparing too
        var sidex, sidey, anglealpha, slopedir;
        sidex = sortedpoints[0 ].x - sortedpoints[1 ].x;
        sidey = sortedpoints[0 ].y - sortedpoints[1 ].y;
        anglealpha = sidey / sidex;
        slopedir = (anglealpha > 0) ? -1 : 1;
//        3. get targetpoint vertical distance from triangle right end
        var sidex_target, sidey_target, yborder;
        sidex_target = sortedpoints[0 ].x - targetpoint.x;
//        get corresponding y position
        sidey_target =  sidex_target * anglealpha;
        yborder = sortedpoints[0 ].y - sidey_target;

        var isclockwise = (slopedir === 1) ? targetpoint.y < yborder : targetpoint.y > yborder;
        console.log( isclockwise );

        return isclockwise;

    }

};


bodypart.threeJointSolver = function (posobj) {

    var newtargetposition;
    var jointposition = {
        x : this.parentobj.abscoordinates.endx,
        y : this.parentobj.abscoordinates.endy
    };

    newtargetposition = placeonline(posobj, jointposition, this.length);

    return newtargetposition;

    function placeonline (targetposobj, jointposobj, jointlength) {

//        get angles
        var dx, dy, hypotenuse, angleattarget, angleatjoint;

        dx = Math.abs(targetposobj.x - jointposobj.x);
        dy = Math.abs(targetposobj.y - jointposobj.y);
        hypotenuse = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));

        angleattarget = dy / hypotenuse;
        angleatjoint  = dx / hypotenuse;

//        calculate target positions
        var targetdx, targetdy;

        targetdx = angleatjoint  * jointlength;
        targetdy = angleattarget * jointlength;

//        add or remove
        var newx, newy;

        if (targetposobj.x > jointposobj.x) {
            newx = targetposobj.x - targetdx;
        } else {
            newx = targetposobj.x + targetdx;
        }


        if (targetposobj.y > jointposobj.y) {
            newy = targetposobj.y - targetdy;
        } else {
            newy = targetposobj.y + targetdy;
        }

        return {x: newx, y: newy};


    }

};

// draw a targetpoint
function drawtarget ( x, y, strokeStyle ) {
    strokeStyle = strokeStyle || "black";
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = strokeStyle;
    ctx.arc( x, y, 4, 0, 2*Math.PI);
    ctx.stroke();
    ctx.restore();

};

var firsttargetcoords = {x: 230, y:200};

drawtarget(firsttargetcoords.x, firsttargetcoords.y, "green");

// A. First let's do a two point solver
var newtargets = Leg1Joint1Joint1.twoJointSolver(firsttargetcoords);

//// 1. rotate the parent to the position
//Leg1Joint1.update({rotation: newtargets.parentortation});
//
//// 2. rotate the child to the position
//Leg1Joint1Joint1.update({rotation: newtargets.endrotation});


//// B. Do the three point solver (endpoint: Leg1Joint1Joint1
//drawtarget(520, 190);
//
//// 1. Find parents new target position
//
//var parenttarget = Leg1Joint1Joint1.threeJointSolver({x:520, y:190});
//
//// 2. rotate parent as new two joint example
//var parentnewtarget = Leg1Joint1.twoJointSolver(parenttarget);
//Leg1.update({rotation: parentnewtarget.parentortation});
//Leg1Joint1.update({rotation: parentnewtarget.endjointrotation});
//
//drawtarget(parenttarget.x, parenttarget.y, "red");









////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////
//  simple animation
////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////


function cycler (input) {
//    input: 0...1, output: 0...1...0
    return Math.sin((input * 180) * (Math.PI/180.0));
}

var starttime = null;
var elapsedtime = 0;

function moveanimal(timestamp) {
    if ( !starttime ) {
        starttime = timestamp;
    }

    elapsedtime = timestamp - starttime;

    moveLeg1(elapsedtime);
    moveLeg1Joint1(elapsedtime);

    window.requestAnimationFrame(moveanimal);
}

// moveanimal();

var minrotation = -70;
var maxrotaiton = 0;
var rotationrange = maxrotaiton - minrotation;
var animduration = 7000;

function moveLeg1 (elapsedtime) {
    var targetrotation = minrotation + cycler((elapsedtime % animduration) / animduration) * rotationrange;
    Leg1.update({rotation: targetrotation});
}

var minrotation2 = -30;
var maxrotaiton2 = 30;
var rotationrange2 = maxrotaiton2 - minrotation2;
var animduration2 = 7000;


function moveLeg1Joint1 (elapsedtime) {
    var targetrotation = minrotation2 + cycler((elapsedtime % animduration2) / animduration2) * rotationrange2;
    Leg1Joint1.update({rotation: targetrotation});
}







