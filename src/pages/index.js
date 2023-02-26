import React, { useRef, useEffect, use } from "react";
import { collisions } from "Assets/Assets Final/Collisions/marshlandCollisions";
import { encountersData } from "Assets/Assets Final/Collisions/marshlandEncounters";
import { gsap } from "gsap";

const Canvas = () => {
  const canvasRef = useRef(null);
  const battle = {
    initiated: false,
    introAnimated: false,
  };
  const overlayDivRef = useRef(null);

  useEffect(() => {
    const image = new Image();
    image.src = "/Zones/Marshland Zone.png";
    const playerImageDown = new Image();
    playerImageDown.src = "/Characters/NerdForward.png";
    const playerImageUp = new Image();
    playerImageUp.src = "/Characters/NerdAway.png";
    const playerImageRight = new Image();
    playerImageRight.src = "/Characters/NerdRight.png";
    const playerImageLeft = new Image();
    playerImageLeft.src = "/Characters/NerdLeft.png";
    const foregroundImage = new Image();
    foregroundImage.src = "/Zones/marshlandForeground.png";

    const canvas = canvasRef.current;
    const c = canvas.getContext("2d");

    const movables = [];
    const collisionsMap = [];
    for (let i = 0; i < collisions.length; i += 60) {
      collisionsMap.push(collisions.slice(i, i + 60));
    }
    const encountersMap = [];
    for (let i = 0; i < encountersData.length; i += 60) {
      encountersMap.push(encountersData.slice(i, i + 60));
    }
    const offset = {
      x: -355,
      y: -260,
    };

    //**CUT CLASSES TO NEW FILE */
    class Boundary {
      static width = 32;
      static height = 32;
      constructor({ position }) {
        this.position = position;
        this.width = 32;
        this.height = 32;
      }
      draw() {
        c.fillStyle = "rgba(255,0,0,0.5)";
        c.fillRect(this.position.x, this.position.y, this.width, this.height);
      }
    }

    class Sprite {
      constructor({ position, velocity, image, frames = { max: 1 }, sprites }) {
        this.position = position;
        this.image = image;
        this.frames = { ...frames, val: 0, elapsed: 0 };
        this.sprites = sprites;

        this.image.onload = () => {
          this.width = this.image.width / this.frames.max;
          this.height = this.image.height;
        };
        this.moving = false;
      }

      draw() {
        c.drawImage(
          this.image,
          this.frames.val * this.width,
          0,
          this.image.width / this.frames.max,
          this.image.height,
          this.position.x,
          this.position.y,
          this.image.width / this.frames.max,
          this.image.height
        );
        if (this.frames.max > 1) {
          this.frames.elapsed++;
        }
        if (!this.moving) return;
        if (this.frames.elapsed % 10 === 0) {
          if (this.frames.val < this.frames.max - 1) {
            this.frames.val++;
            this.frames.elapsed = 0;
          } else {
            this.frames.val = 0;
            this.frames.elapsed = 0;
          }
        }
      }
    }
    //**CUT CLASSES TO NEW FILE */

    const boundaries = [];
    collisionsMap.forEach((row, i) => {
      row.forEach((symbol, j) => {
        if (symbol === 6973) {
          boundaries.push(
            new Boundary({
              position: {
                x: j * Boundary.width + offset.x,
                y: i * Boundary.height + offset.y,
              },
            })
          );
        }
      });
    });
    movables.push(...boundaries);

    const encounters = [];
    encountersMap.forEach((row, i) => {
      row.forEach((symbol, j) => {
        if (symbol === 6755 || symbol === 6947) {
          encounters.push(
            new Boundary({
              position: {
                x: j * Boundary.width + offset.x,
                y: i * Boundary.height + offset.y,
              },
            })
          );
        }
      });
    });
    movables.push(...encounters);
    console.log(encounters);

    const keys = {
      w: {
        pressed: false,
      },
      a: {
        pressed: false,
      },
      s: {
        pressed: false,
      },
      d: {
        pressed: false,
      },
    };

    const player = new Sprite({
      position: {
        x: canvas.width / 2 - 96 / 4 / 2,
        y: canvas.height / 2 - 32 / 2,
      },
      image: playerImageDown,
      frames: {
        max: 3,
      },
      sprites: {
        up: playerImageUp,
        down: playerImageDown,
        left: playerImageLeft,
        right: playerImageRight,
      },
    });

    const background = new Sprite({
      position: {
        x: offset.x,
        y: offset.y,
      },
      image: image,
    });
    movables.push(background);

    const foreground = new Sprite({
      position: {
        x: offset.x,
        y: offset.y,
      },
      image: foregroundImage,
    });
    movables.push(foreground);

    function rectangularCollision({ rect1, rect2 }) {
      return (
        rect1.position.x + rect1.width >= rect2.position.x &&
        rect1.position.x <= rect2.position.x + rect2.width &&
        rect1.position.y <= rect2.position.y + rect2.height &&
        rect1.position.y + rect1.height >= rect2.position.y
      );
    }

    function Animate() {
      window.requestAnimationFrame(Animate);
      background.draw();
      boundaries.forEach((boundary) => {
        boundary.draw();
      });
      encounters.forEach((cell) => {
        cell.draw();
      });
      player.draw();
      foreground.draw();

      let moving = true;
      player.moving = false;

      if (battle.initiated && !battle.introAnimated) {
        // TODO: Animate exit
        battle.introAnimated = true;

        gsap.to(overlayDivRef.current, {
          opacity: 1,
          repeat: 4,
          duration: 0.4,
          onComplete: () => {
            gsap.to(overlayDivRef.current, {
              opacity: 0,
              duration: 0.4,
            });
          },
        });
      }

      if (
        keys.w.pressed ||
        keys.a.pressed ||
        keys.s.pressed ||
        keys.d.pressed
      ) {
        for (let i = 0; i < encounters.length; i++) {
          const encounter = encounters[i];
          const overlappingArea =
            (Math.min(
              player.position.x + player.width,
              encounter.position.x + encounter.width
            ) -
              Math.max(player.position.x, encounter.position.x)) *
            (Math.min(
              player.position.y + player.height,
              encounter.position.y + encounter.height
            ) -
              Math.max(player.position.y, encounter.position.y));
          if (
            rectangularCollision({
              rect1: player,
              rect2: encounter,
            }) &&
            overlappingArea > (player.width * player.height) / 3 &&
            Math.random() < 0.0075
          ) {
            //battle.initiated seems to stop movement on the SECOND trigger of a battle for some reason.
            console.log("Activate Battle");
            battle.initiated = true;
            battle.introAnimated = false;
            break;
          }
        }
      }
      if (keys.w.pressed && lastkey === "w") {
        player.image = player.sprites.up;
        player.moving = true;
        for (let i = 0; i < boundaries.length; i++) {
          const boundary = boundaries[i];
          if (
            rectangularCollision({
              rect1: player,
              rect2: {
                ...boundary,
                position: {
                  x: boundary.position.x,
                  y: boundary.position.y + 3,
                },
              },
            })
          ) {
            moving = false;
            break;
          }
        }

        if (moving)
          movables.forEach((movable) => {
            movable.position.y += 3;
          });
      } else if (keys.a.pressed) {
        player.image = player.sprites.left;
        player.moving = true;
        for (let i = 0; i < boundaries.length; i++) {
          const boundary = boundaries[i];
          if (
            rectangularCollision({
              rect1: player,
              rect2: {
                ...boundary,
                position: {
                  x: boundary.position.x + 3,
                  y: boundary.position.y,
                },
              },
            })
          ) {
            moving = false;
            break;
          }
        }
        if (moving)
          movables.forEach((movable) => {
            movable.position.x += 3;
          });
      } else if (keys.s.pressed) {
        player.image = player.sprites.down;
        player.moving = true;
        for (let i = 0; i < boundaries.length; i++) {
          const boundary = boundaries[i];
          if (
            rectangularCollision({
              rect1: player,
              rect2: {
                ...boundary,
                position: {
                  x: boundary.position.x,
                  y: boundary.position.y - 3,
                },
              },
            })
          ) {
            moving = false;
            break;
          }
        }
        if (moving)
          movables.forEach((movable) => {
            movable.position.y -= 3;
          });
      } else if (keys.d.pressed) {
        player.image = player.sprites.right;
        player.moving = true;
        for (let i = 0; i < boundaries.length; i++) {
          const boundary = boundaries[i];
          if (
            rectangularCollision({
              rect1: player,
              rect2: {
                ...boundary,
                position: {
                  x: boundary.position.x - 3,
                  y: boundary.position.y,
                },
              },
            })
          ) {
            moving = false;
            break;
          }
        }
        if (moving)
          movables.forEach((movable) => {
            movable.position.x -= 3;
          });
      }
    }
    Animate();

    let lastkey = "";
    window.addEventListener("keydown", (e) => {
      switch (e.key) {
        case "w":
          keys.w.pressed = true;
          lastkey = "w";
          break;
        case "a":
          keys.a.pressed = true;
          lastkey = "a";
          break;
        case "s":
          keys.s.pressed = true;
          lastkey = "s";
          break;
        case "d":
          keys.d.pressed = true;
          lastkey = "d";
          break;
        case "t":
          console.log(collisions);
          break;
      }
    });
    window.addEventListener("keyup", (e) => {
      switch (e.key) {
        case "w":
          keys.w.pressed = false;
          break;
        case "a":
          keys.a.pressed = false;
          break;
        case "s":
          keys.s.pressed = false;
          break;
        case "d":
          keys.d.pressed = false;
          break;
      }
    });
  }, []);

  return (
    <main className="h-screen w-full bg-slate-500 flex place-content-center flex-col justify-center gap-4">
      <h1 className="flex place-content-center font-extrabold text-white text-4xl">
        Tokemon!
      </h1>
      <div className="flex place-self-center flex-col place-content-center">
        <div
          ref={overlayDivRef}
          className="bg-black flex h-[550px] w-[1094px] place-self-center absolute opacity-0 pointer-events-none"
        ></div>
        <canvas
          className="flex place-self-center border-black border-2 rounded-md"
          ref={canvasRef}
          width={1094}
          height={550}
        ></canvas>
      </div>
    </main>
  );
};

export default Canvas;
