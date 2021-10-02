import Phaser from 'phaser'
import { Container, Ship } from './ship'
import { Station } from './station'

const MIN_SHIELD_TIME =  2 // s
const MAX_SHIELD_TIME =  5 // s
const VULNERABLE_TIME = 10 // s


const toMMSS = ms => {
  let negative = ''
  if (ms < 0)
  {
    negative = '-'
    ms = Math.abs(ms)
  }

  let minutes = Math.floor(ms / 60000)
  let seconds = Math.round(ms % 60000 / 1000)

  if (seconds == 60)
  {
    minutes += 1
    seconds = 0
  }

  minutes = minutes < 10 ? `0${minutes}` : minutes
  seconds = seconds < 10 ? `0${seconds}` : seconds

  return `${negative}${minutes}:${seconds}`
}


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

    this.ship = new Ship(this, 50, 50)
    this.player.add(this.ship, true)

    for (let index = 0; index < 2; index++)
    {
      let container = new Container(this, 150, 150)
      this.player.add(container, true)

      const lag = 20 + (20 * index)
      container.attachTo(this.ship, lag)
    }

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
      fire: 'SPACE',
    })

    let onoff = 1
    this.input.on('pointerdown', () => {
      onoff ^= 1
      this.station.toggleShield(onoff)
    })
  }

  update(time, delta)
  {
    const pointer = this.input.activePointer

    this.countdownValue -= delta
    this.countdownText.setText(toMMSS(this.countdownValue))

    if (this.bindings.accel.isDown)
    {
      this.ship.nextRotation = Phaser.Math.Angle.RotateTo(this.ship.nextRotation, this.ship.rotation, 0.025)
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
  }

  beginInstability()
  {
    const actual = Phaser.Math.RND.between(MIN_SHIELD_TIME, MAX_SHIELD_TIME) * 1000
    const estimated = actual + Phaser.Math.RND.between(actual / 4, actual * 4)

    console.log(`~${estimated} [${toMMSS(estimated)}] ${actual} [${toMMSS(actual)}]`)
    this.countdownValue = estimated
    this.time.addEvent({
      // first instability in 2:30 to 5:00 minutes
      delay: actual,
      repeat: false,

      callback: () => {
        console.log("Vulnerable!")
        // become vulnerable
        this.station.toggleShield(0)
        this.station.rebooting = true
        this.countdownValue = VULNERABLE_TIME * 1000
        this.countdownInfoText.setText("Vulnerable")
        this.countdownInfoText.setColor('#DD0000')

        this.time.addEvent({
          delay: VULNERABLE_TIME * 1000,
          repeat: false,
          callback: () => {
            console.log("Secure!")
            this.station.toggleShield(1)
            this.station.rebooting = false
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
