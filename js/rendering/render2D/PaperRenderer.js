//------------------------------------------------------------------------------
// 
//        DDDD     RRRR      AAA     W         W       222222    DDDD
//        D  DD    R   R    A   A    W         W      22    22   D   DD
//        D   DD   RRRR     AAAAA     WW  W  WW           22     D    DD
//        D  DD    R  RR   AA   AA     W WWW W          22       D   DD
//        DDDD     R   R   A     A     WW   WW         2222222   DDDDD
//
//------------------------------------------------------------------------------

Render2D = function(divID) {

    var canvas = document.getElementById(divID)
    paper.setup(canvas);
    var path = new paper.Path();
    path.strokeColor = "black";
    var start = new paper.Point(100, 100);
    path.moveTo(start);
    path.lineTo(start.add([200, -50]));
    paper.view.draw();
}