'use strict';

var videoElement = document.createElement('video');
var imageCapture = document.createElement('canvas');
var delayedImage = document.createElement('canvas');
var diffCanvas = document.createElement('canvas');
var context1 = imageCapture.getContext('2d');
var context2 = delayedImage.getContext('2d');
var context3 = diffCanvas.getContext('2d');
var videoSource;
var width = imageCapture.width = delayedImage.width = diffCanvas.width = 640;
var height = imageCapture.height = delayedImage.height = diffCanvas.height = 480;
var buffer = [];
var bufferimage;
var frames = 0;
var treshold = 30;

context2.globalAlpha = 0.002;
context2.globalCompositeOperation = "darken";

navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

function gotSources(sourceInfos) {
    for (var i = 0; i !== sourceInfos.length; ++i) {
        if (sourceInfos[i].kind === 'video') {
            videoSource = sourceInfos[i];
        } else {
            console.log('Some other kind of source: ', sourceInfo);
        }
    }
}

if (typeof MediaStreamTrack === 'undefined' || typeof MediaStreamTrack.getSources === 'undefined') {
    alert('This browser does not support MediaStreamTrack.\n\nTry Chrome.');
} else {
    MediaStreamTrack.getSources(gotSources);
}

function successCallback(stream) {
    window.stream = stream; // make stream available to console
    videoElement.src = window.URL.createObjectURL(stream);
    videoElement.play();
}

function errorCallback(error) {
    console.log('navigator.getUserMedia error: ', error);
}

function start() {
    if (window.stream) {
        videoElement.src = null;
        window.stream.stop();
    }
    var constraints = {
        video: {
            optional: [{
                sourceId: videoSource
            }]
        }
    };
    navigator.getUserMedia(constraints, successCallback, errorCallback);
    
    do{
        var image = readFrame();
        if (image){
            for(var i=0,j=image.data.length;i<j;i+=4){
                buffer.push(image.data[i]);
                buffer.push(image.data[i+1]);
                buffer.push(image.data[i+2]);
                buffer.push(255);
            }
            bufferimage = image;
        } 
    }while( !image );
    document.getElementById('container').appendChild(videoElement);
    document.getElementById('container').appendChild(delayedImage);
    document.getElementById('container').appendChild(diffCanvas);
    requestAnimationFrame(draw);
}

function draw(){
    requestAnimationFrame(draw);
    frames++;
    var image = readFrame();
    if (frames == 60) {
    //    context2.drawImage(videoElement, 0, 0);
        if (image) {
            for(var i=0,j=image.data.length;i<j;i+=4){
                bufferimage.data[i] = buffer[i] = buffer[i]*0.99 + image.data[i]*0.01;
                bufferimage.data[i+1] = buffer[i+1] = buffer[i+1]*0.99 + image.data[i+1]*0.01;
                bufferimage.data[i+2] = buffer[i+2] = buffer[i+2]*0.99 + image.data[i+2]*0.01;
                bufferimage.data[i+3] = buffer[i+3] = 255;
            }
            context2.putImageData(bufferimage, 0, 0);
           }
        frames = 0;
    }
    
    if (image) {
        for(var i=0,j=image.data.length;i<j;i+=4){
            if ( Math.sqrt((buffer[i]-image.data[i])*(buffer[i]-image.data[i]))+((buffer[i+1]-image.data[i+1])*(buffer[i+1]-image.data[i+1]))+((buffer[i+2]-image.data[i+2])*(buffer[i+2]-image.data[i+2])) > treshold ){
                bufferimage.data[i] = bufferimage.data[i+1] = bufferimage.data[i+2] = 255;
            } else {
                bufferimage.data[i] = bufferimage.data[i+1] = bufferimage.data[i+2] = 0;
            } 
            bufferimage.data[i+3] = buffer[i+3] = 255;
        }
        context3.putImageData(bufferimage, 0, 0);
    }
    //context3.drawImage(canvas2, 0, 0);
    //context3.globalCompositionOperation = "xor";
}

function readFrame() {
    try {
      context1.drawImage(videoElement, 0, 0, width, height);
    } catch (e) {
      // The video may not be ready, yet.
      return null;
    }
    return context1.getImageData(0,0,width,height);
}


start();