import React, { useEffect, useRef, useState } from 'react';
import cosmos from '../images/cosmos.jpeg';
import earth from '../images/earth.png';
import '../styles.css';

//SVG URI
const svgns = "http://www.w3.org/2000/svg";

//setting canvas width and height
const canvasWidth = 1500, canvasHeight = 550;

function AudioPlayer() {
    
    //initializing the state variables
    const [isMusicAdded, setIsMusicAdded] = useState(false);
    const [selectedMusic, setSelectedMusic] = useState(null);
    const [audioSrc, setAudioSrc] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    //

    //initializing the non-state variables//
        
        // variables required to set the audio context using web audio API
        const audioContext = useRef();
        const audioElement = useRef();
        const audioSource = useRef();
        const gainNode = useRef();
        const analyserNode = useRef();
        //

        const dataArray = useRef();

        const cosmosImgElement = useRef();
        const earthImgElement = useRef();
    
        const canvasElement = useRef();
        const canvasContext = useRef();

        const animationRefId = useRef();
    //

    //Setting up the Audio Context using Web Audio API (this will be called only once after the initial render)
    useEffect(() => {

        audioContext.current = new (window.AudioContext || window.webkitAudioContext)();

        audioContext.current.suspend();

        audioElement.current = document.getElementById('myAudio');

        audioSource.current = audioContext.current.createMediaElementSource(audioElement.current);

        gainNode.current = audioContext.current.createGain();

        //creating analyser node for capturing audio data
        analyserNode.current = audioContext.current.createAnalyser();

        //setting the window size for the audio data that would be captured
        analyserNode.current.fftSize = 512;

        audioSource.current.connect(analyserNode.current);

        analyserNode.current.connect(gainNode.current);

        gainNode.current.connect(audioContext.current.destination);

        //this is where the audio data would be stored
        dataArray.current = new Uint8Array(analyserNode.current.frequencyBinCount);

        cosmosImgElement.current = document.getElementById('cosmosImage');

        earthImgElement.current = document.getElementById('earthImage');

        canvasElement.current = document.getElementById('myCanvas');

        canvasContext.current = canvasElement.current.getContext('2d');

        var gradient = canvasContext.current.createLinearGradient(0, 0, canvasWidth, canvasHeight);

        gradient.addColorStop(0, 'black');
        gradient.addColorStop(1, 'white');

        canvasContext.current.fillStyle = gradient;

        canvasContext.current.fillRect(0, 0, canvasWidth, canvasHeight);

        return () => {
            if (audioSource.current) {
                audioSource.current.disconnect();
            }
        };

    },[]);
    //

    //Function that handles the Dynamic visualisation while the audio plays
    const draw = () => {
        try{
            animationRefId.current = requestAnimationFrame(draw);

            canvasContext.current.clearRect(0, 0, canvasWidth, canvasHeight);

            canvasContext.current.drawImage(cosmosImgElement.current, 0, 0, canvasWidth, canvasHeight);

            // getting the wavefrom data to plot oscillation style waves
            analyserNode.current.getByteTimeDomainData(dataArray.current);

            var arrLen = dataArray.current.length;

            canvasContext.current.lineWidth = 2;

            canvasContext.current.strokeStyle = 'rgb(255,255,255)';

            canvasContext.current.beginPath();

            var sliceWidth = canvasWidth / arrLen, x = 0;

            for (var i = 0; i < arrLen; i++) {

                var v = dataArray.current[i] / 128;

                var y = v * canvasHeight / 2;

                if (i === 0) {
                    canvasContext.current.moveTo(x, y);
                } else {
                    canvasContext.current.lineTo(x, y);
                }

                x += sliceWidth;
            }

            canvasContext.current.lineTo(canvasWidth, canvasHeight / 2);

            canvasContext.current.stroke();

            //getting the frequent domain data to plot frequency bar graph
            analyserNode.current.getByteFrequencyData(dataArray.current);

            arrLen = dataArray.current.length;

            var barHeight, barWidth = (canvasWidth / arrLen) * 2.5, sum = 0; x = 0;

            for (i = 0; i < arrLen; i++) {

                sum += dataArray.current[i];

                barHeight = dataArray.current[i];

                canvasContext.current.fillStyle = `rgb(140,160,200)`;

                canvasContext.current.fillRect(x, canvasHeight - (barHeight / 2), barWidth, barHeight);

                x += barWidth + 1;
            }

            const avg = sum / arrLen;

            const imgDiameter = 1.5 * avg;

            canvasContext.current.drawImage(earthImgElement.current, (canvasWidth - imgDiameter) / 2, (canvasHeight - imgDiameter) / 2, imgDiameter, imgDiameter);
        }catch(err){
            console.log('error in draw function in AudioPlayer component: ', err);
        }
    };
    //

    //When you click play, resuming the Audio Context and invoking the draw() function
    const handlePlay = () => {
        try{
            audioContext.current.resume();
            draw(); // for Dynamic Visualisation
            setIsPlaying(true);
        }catch(err){
            console.log('error in handlePlay method in AudioPlayer component: ', err);
        }
    };
    //

    //When you pause the audio, suspending the Audio Context
    const handlePause = () => {
        try{
            audioContext.current.suspend();
            setIsPlaying(false);
        }catch(err){
            console.log('error in handlePause method in AudioPlayer component: ', err);
        }
    }
    //

    //When the audio ends, canceling the animation frame request that we scheduled in the draw() function
    const handleEnd = () => {
        try{
            cancelAnimationFrame(animationRefId.current);
            gainNode.current.gain.value = 1;
            setIsPlaying(false);
        }catch(err){
            console.log('error in handleEnd method in AudioPlayer component: ', err);
        }
    }

    //when you upload a music
    const handleMusicChange = e => {
        try{

            const file = e.target.files[0];
            const reader = new FileReader();

            reader.onload = (ev) => {

                setAudioSrc(ev.target.result);
                setSelectedMusic(file);

                audioElement.current.src = ev.target.result; // update the source of the audio element
                audioElement.current.load(); // load the new track
                setIsMusicAdded(true);
            };

            reader.readAsDataURL(file);

        }catch(err){
            console.log('error in handleMusicChange method in AudioPlayer component: ', err);
        }
    }
    //

    
    return (
        <div id='mainDiv'>
            {!isMusicAdded && <h1>Welcome to the Cosmic Music Visualiser!</h1>}
            <div id='containerDiv'>
                <img id="cosmosImage" src={cosmos} style={{ display: 'none' }} alt="cosmos" />
                <img id="earthImage" src={earth} style={{ display: 'none' }} alt="earth" />
                <canvas id="myCanvas" width={canvasWidth} height={canvasHeight} style={{ display: 'block', border: 'solid 4px' }}>
                    Your browser does not support the HTML Canvas tag.
                </canvas>
                <br />
                <audio id="myAudio" style={{display: isMusicAdded ? 'block' : 'none', margin: 'auto'}} onPlay={handlePlay} onPause={handlePause} onEnded={handleEnd} controls>
                    <source src={audioSrc} type="audio/mpeg" />
                </audio>
                <div style={{marginTop: isMusicAdded ? '20px' : '0px'}}>
                    <input type="file" accept='audio/*' name="file" onChange={handleMusicChange} style={{color: '#ececec'}} />
                </div>
                <br />
            </div>
        </div>
    );
}

export default AudioPlayer;