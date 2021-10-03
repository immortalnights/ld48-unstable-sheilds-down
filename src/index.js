import Phaser from 'phaser'
import Asteroid from './asteroid'
import { Container, Ship } from './ship'
import { Station } from './station'
import { findClosestTarget, getOppositeDirection, getRandomDirection, toMMSS } from './utilities'


const MIN_SHIELD_TIME =  5 // s
const MAX_SHIELD_TIME =  8 // s
const VULNERABLE_TIME = 10 // s

const INITIAL_ASTEROIDS = 4
const MAXIMUM_ASTEROIDS = 12

const ATTACH_RANGE = 25


class Unstable extends Phaser.Scene
{
  constructor()
  {
    super({
      physics: {
        default: 'arcade',
        arcade: {
          debug: false
        }
      }
    })
  }

  preload()
  {
  }

  create()
  {
    const { width, height } = this.sys.game.canvas

    this.player = this.physics.add.group()
    // container group does not need physics
    this.containers = this.add.group()
    this.asteroids = this.physics.add.group()

    this.ship = new Ship(this, width / 2, height / 2 - 50)
    this.player.add(this.ship, true)

    const initialContainers = 2
    let xOffset = -(10 * (initialContainers / 2))
    for (let index = 0; index < initialContainers; index++)
    {
      // console.log(index, xOffset)
      let container = new Container(this, width / 2 + xOffset, height / 2 + 50)
      this.player.add(container, true)
      this.containers.add(container)

      xOffset += 20
    }

    this.spawnAsteroids(INITIAL_ASTEROIDS)

    this.station = new Station(this, width / 2, height / 2)
    this.player.add(this.station, true)

    this.beginInstability()

    this.countdownInfoText = this.add.text(width / 2 - 34, 10, "Secure", {
      color: '#00DD00'
    })
    this.countdownText = this.add.text(width / 2 - 34, 26, toMMSS(this.estimatedInstabilityTime), {
      fontSize: 32,
    })

    // use cursor keys only for now
    this.bindings = this.input.keyboard.addKeys({
      accel: 'UP',
      break: 'DOWN',
      left: 'LEFT',
      right: 'RIGHT',
      coupler: 'SPACE',
    })

    this.bindings.coupler.on('down', () => {
      const target = findClosestTarget(this.ship, this.containers, ATTACH_RANGE)

      if (target)
      {
        this.ship.attach(target.obj)
        this.containers.remove(target.obj)
      }
      else
      {
        const container = this.ship.detach()

        if (container)
        {
          this.containers.add(container)
        }
      }
    })

    // Spawn some asteroids every few seconds
    this.time.addEvent({
      delay: 2000,
      repeat: -1,
      callback: () => {
        const diff = Math.max(MAXIMUM_ASTEROIDS - (this.asteroids.getChildren().length), 0)
        const spawnCount = Phaser.Math.RND.between(0, diff)
        this.spawnAsteroids(spawnCount)
      }
    })
  }

  update(time, delta)
  {
    const pointer = this.input.activePointer

    this.countdownValue -= delta
    this.countdownText.setText(toMMSS(this.countdownValue))

    this.ship.nextRotation = Phaser.Math.Angle.RotateTo(this.ship.nextRotation, this.ship.rotation, 0.025)

    if (this.bindings.accel.isDown)
    {
      const targetVelocity = this.physics.velocityFromRotation(this.ship.nextRotation, this.ship.speed)
      this.ship.body.velocity.lerp(targetVelocity, 0.01)
    }
    else if (this.bindings.break.isDown)
    {
      this.ship.body.velocity.divide({ x: 1.01, y: 1.01 })
      const stopSpeed = 8
      if (this.ship.body.velocity.x < stopSpeed && this.ship.body.velocity.x > -stopSpeed && this.ship.body.velocity.y < stopSpeed && this.ship.body.velocity.y > -stopSpeed)
      {
        this.ship.body.velocity.x = 0
        this.ship.body.velocity.y = 0
      }
    }

    if (this.bindings.left.isDown)
    {
      this.ship.body.angularVelocity = -this.ship.rotationSpeed
    }
    else if (this.bindings.right.isDown)
    {
      this.ship.body.angularVelocity = this.ship.rotationSpeed
    }
    else
    {
      this.ship.body.angularVelocity = 0
    }

    // Check for asteroid mining
  }

  isObjOffscreen(obj)
  {
    let offscreen = false
    const { width, height } = this.sys.game.canvas

    if (obj.x < -(obj.width / 2) || obj.x > width + (obj.width / 2))
    {
      // console.log(`Object off on x-axis ${obj.x} ${obj.getData('offscreenTime')}`)
      offscreen = true
    }
    else if (obj.y < -(obj.height / 2) || obj.y > height + (obj.height / 2))
    {
      // console.log(`Object off on y-axis ${obj.y} ${obj.getData('offscreenTime')}`)
      offscreen = true
    }

    return offscreen
  }

  getRandomOffscreenPosition(direction)
  {
    const { width, height } = this.sys.game.canvas

    if (direction == undefined)
    {
      direction = getRandomDirection()
    }

    let x = 0
    let y = 0
    switch (direction)
    {
      case 'top':
      {
        x = Phaser.Math.RND.between(-50, width + 50)
        y = -20
        break
      }
      case 'right':
      {
        x = width + 50
        y = Phaser.Math.RND.between(-50, height + 50)
        break
      }
      case 'bottom':
      {
        x = Phaser.Math.RND.between(-50, width + 50)
        y = height + 20
        break
      }
      case 'left':
      {
        x = -50
        y = Phaser.Math.RND.between(-50, height + 50)
        break
      }
    }

    return { x, y }
  }

  spawnAsteroids(num)
  {
    for (let index = 0; index < num; index ++)
    {
      const spawnDirection = getRandomDirection()
      const position = this.getRandomOffscreenPosition(spawnDirection)
      const targetPosition = this.getRandomOffscreenPosition(getOppositeDirection(spawnDirection))

      const asteroid = new Asteroid(this, position.x, position.y, 20)
      this.asteroids.add(asteroid, true)

      const rotation = Phaser.Math.Angle.BetweenPoints(asteroid, targetPosition)
      this.physics.velocityFromRotation(rotation, asteroid.getData('speed'), asteroid.body.velocity)
    }
    console.log(`Spawned ${num} asteroids (total=${this.asteroids.getChildren().length})`)
  }

  beginInstability()
  {
    const actual = Phaser.Math.RND.between(MIN_SHIELD_TIME, MAX_SHIELD_TIME) * 1000
    const estimated = actual + Phaser.Math.RND.between(actual / 2, actual * 2)

    console.log(`~${estimated} [${toMMSS(estimated)}] ${actual} [${toMMSS(actual)}]`)
    this.countdownValue = estimated
    this.time.addEvent({
      // first instability in 2:30 to 5:00 minutes
      delay: actual,
      repeat: false,

      callback: () => {
        console.log("Vulnerable!")
        // become vulnerable
        this.station.data.set('rebooting', true)
        this.countdownValue = VULNERABLE_TIME * 1000
        this.countdownInfoText.setText("Vulnerable")
        this.countdownInfoText.setColor('#DD0000')

        this.time.addEvent({
          delay: VULNERABLE_TIME * 1000,
          repeat: false,
          callback: () => {
            console.log("Secure!")
            this.station.data.set('rebooting', false)
            this.countdownInfoText.setText("Secure")
            this.countdownInfoText.setColor('#00DD00')
            this.beginInstability()
          }
        })
      }
    })
  }
}

const config = {
  type: Phaser.AUTO,
  parent: '',
  width: 800,
  height: 600,
  scene: Unstable,
}

const game = new Phaser.Game(config)
