// src/components/Game.js
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { startFiring, stopFiring, updateRocketPosition, resetHoldDuration } from '../store';
import { INITIAL_ROTATION } from './config';
import { getDistanceBetweenPoints } from './utils';

const Game = () => {
  const canvasRef = useRef(null);
  const dispatch = useDispatch();
  const { isFiring, rocketPosition, holdDuration, tokens } = useSelector((state) => state.game);
  const [currentHoldDuration, setCurrentHoldDuration] = useState(0);
  const intervalRef = useRef(null);
  const rocketIntervalRef = useRef(null);
  const holdStartTimeRef = useRef(null);
  const launchTimeRef = useRef(null);
  const rocketImageRef = useRef(null); // Reference for the rocket image

  const [targets, setTargets] = useState([])
  const [explosions, setExplosions] = useState([])

  const [score, setScore] = useState(0)

  const isHitTarget = (target, rocketPosition) => {

    const distance = getDistanceBetweenPoints({
      // x:window.innerWidth  - target.x,
      // y:window.innerHeight - target.y
      x: 0 + target.x,
      y: window.innerHeight - target.y
    }, {
      x: rocketPosition.x + 55 + 25,
      y: window.innerHeight - rocketPosition.y - 100 + 25
    });
    if (distance > 2500) return false;
    return true;
  }


  const destroyTarget = (targetIndex) => {
    setScore((prev) => prev + 1)
    setTargets((prev) => {
      const temp = [...prev];
      temp.splice(targetIndex, 1);
      return temp;
    })

  }

  const generateTargets = (targetCount = 2) => {
    const tempTargets = [];
    for (let i = 0; i < targetCount; i++) {

      tempTargets.push({
        x: Math.random() * 50 + 100,
        y: Math.random() * 50 + 50 * (i + 1) + 100,
        status: false
      })
    }
    setTargets(tempTargets)
  }

  useEffect(() => {
    generateTargets()
  }, [])



  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const rocketImage = new Image();
    rocketImage.src = '/images/rocket_1.png'; // Update the path to your image
    rocketImage.onload = () => {
      rocketImageRef.current = rocketImage;
      draw(); // Initial draw after loading the image
    };

    // Set canvas dimensions
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const drawLauncher = () => {
      ctx.fillStyle = 'gray';
      ctx.fillRect(50, canvas.height - 150, 60, 120);
      ctx.beginPath();
      ctx.moveTo(50, canvas.height - 150);
      ctx.lineTo(80, canvas.height - 210);
      ctx.lineTo(110, canvas.height - 150);
      ctx.closePath();
      ctx.fill();
    };

    const drawRocket = () => {

      if (rocketImageRef.current) {
        const angle = Math.sqrt(2) - rocketPosition.rAngle;
        console.log(angle, rocketPosition.rAngle)
        ctx.translate(rocketPosition.x + 55, canvas.height - rocketPosition.y - 100);
        ctx.rotate(angle);
        ctx.drawImage(
          rocketImageRef.current,
          0,// rocketPosition.x + 55,
          // canvas.height - rocketPosition.y - 100,
          0,
          50, // width of the rocket image
          50  // height of the rocket image
        );
        ctx.rotate(-angle);
        ctx.translate(-(rocketPosition.x + 55), -(canvas.height - rocketPosition.y - 100));
        // ctx.rotate(30);

      }
    };

    const drawExplosion = () => {
      for (let explosion of explosions) {
        const outerRadius = 30;
        const innerRadius = 20;
        const x = 0 + explosion.x;
        const y = canvas.height - explosion.y
        const gradient = ctx.createRadialGradient(x, y, innerRadius, x, y, outerRadius);
        gradient.addColorStop(0, 'rgba(255,255,0,1)');
        gradient.addColorStop(0.5, 'rgba(255,0,0,1)');
        gradient.addColorStop(1, 'rgba(255,0,0,1)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, outerRadius, 0, Math.PI * 2, false);
        ctx.fill();

        for (let i = 0; i < 20; i++) {
          const sparkX = x + (Math.random() - 0.8) * 100;
          const sparkY = y + (Math.random() - 0.2) * 100;
          const sparkRaidus = Math.random() * 1;
          ctx.fillStyle = 'rgba(255,0,0,0.2)';
          ctx.arc(sparkX, sparkY, sparkRaidus, 0, Math.PI * 2, false);
          ctx.fill()
        }
      }
    }

    const drawTargets = () => {
      ctx.fillStyle = 'blue';
      console.log(targets)
      for (let target of targets) {
        ctx.beginPath();
        // ctx.arc(canvas.width - target.x, canvas.height - target.y, 25, 0, 2 * Math.PI);
        ctx.arc(0 + target.x, canvas.height - target.y, 25, 0, 2 * Math.PI);

        ctx.fill();
      }


    };



    const drawLand = () => {
      ctx.fillStyle = 'green';
      ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
    };


    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawLand();
      drawLauncher();
      drawRocket();
      drawTargets();
      drawExplosion();
    };
    draw();
  }, [rocketPosition, targets, canvasRef, explosions]);

  useEffect(() => {
    if (isFiring) {
      holdStartTimeRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        const elapsedTime = (Date.now() - holdStartTimeRef.current) / 1000; // in seconds
        setCurrentHoldDuration(elapsedTime);
      }, 100);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isFiring]);

  const calculateRocketPosition = (t, v0, angle) => {
    const g = 9.81; // gravity
    let x = v0 * t * Math.cos(angle);// - v0 * 2 * Math.cos(angle) ;
    let y = v0 * t * Math.sin(angle) - 0.5 * g * t * t;
    let rAngle = Math.atan((v0 * Math.sin(angle) - g * t) / (v0 * Math.cos(angle))); // current angle of rocket

    return { x, y, rAngle };
  };

  useEffect(() => {
    if (!isFiring && holdDuration > 0) {
      const launchRocket = () => {
        const g = 9.81; // gravity
        const v0 = holdDuration * 20; // initial velocity based on hold duration
        const angle = Math.PI / 3; // 60 degrees
        launchTimeRef.current = Date.now();

        rocketIntervalRef.current = setInterval(() => {
          const t = (Date.now() - launchTimeRef.current) / 1000; // in seconds
          const { x, y, rAngle } = calculateRocketPosition(t, v0, angle);


          if (y < 0) {
            clearInterval(rocketIntervalRef.current);
            dispatch(updateRocketPosition({ x: 0, y: 0, rAngle: INITIAL_ROTATION })); // Reset position after it falls
          } else {
            dispatch(updateRocketPosition({ x, y, rAngle }));

            for (let i = 0; i < targets.length; i++) {
              if (isHitTarget(targets[i], { x, y })) {
                destroyTarget(i)
                clearInterval(rocketIntervalRef.current)
                dispatch(updateRocketPosition({ x: 0, y: 0, rAngle: INITIAL_ROTATION })); // Reset position after it falls
                setExplosions((prev) => {
                  return [...prev, targets[i]];
                })
                setTimeout(() => {
                  setExplosions((prev) => {
                    const t = [...prev];
                    t.splice(0, 1)
                    setExplosions(t)
                  })
                }, 3000)

                if (targets.length == 1) {
                  setTimeout(() => {
                    generateTargets()
                  }, 3000);
                }
                break;
              }
            }
          }
        }, 40);
      };

      launchRocket();
      // dispatch(resetHoldDuration());
    }

    return () => clearInterval(rocketIntervalRef.current);
  }, [isFiring, holdDuration, dispatch]);

  const handleMouseDown = () => {
    if (tokens > 0) {
      dispatch(startFiring());
    }
  };

  const handleMouseUp = () => {
    const finalHoldDuration = (Date.now() - holdStartTimeRef.current) / 1000; // in seconds
    setCurrentHoldDuration(finalHoldDuration);
    dispatch(stopFiring());
  };

  return (
    <div className="game">

      <div className="tokens">Tokens: {tokens} <h1>Score: {score}</h1></div>
      <canvas ref={canvasRef}></canvas>
      <div className="controls">
        <button onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} disabled={tokens <= 0}>
          Fire Rocket
        </button>
        <div className="hold-bar">
          <div className="hold-duration" style={{ width: `${currentHoldDuration * 10}%` }}></div>
        </div>
      </div>
    </div>
  );
};

export default Game;
