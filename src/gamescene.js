import Phaser from 'phaser'
import Asteroid from './asteroid'
import Bullet from './bullet'
import Enemy from './enemy'
import { Ship, Container } from './ship'
import { Station } from './station'
import { findClosestTarget, findTargetsInRange, getOppositeDirection, getRandomDirection, toMMSS } from './utilities'


const MIN_SHIELD_TIME =  5 // s
const MAX_SHIELD_TIME =  8 // s
const VULNERABLE_TIME = 10 // s

const INITIAL_ASTEROIDS = 4
const MAXIMUM_ASTEROIDS = 12

const MAXIMUM_ENEMIES = 6

const ATTACH_RANGE = 25


export default class Unstable extends Phaser.Scene
{
    constructor()
    {
        super({
            key: 'game',
            physics: {
                default: 'arcade',
                arcade: {
                    debug: false
                }
            }
        })
    }

    init()
    {
        console.log("Game.init")
    }

    preload()
    {
        console.log("Game.preload")
    }

    create()
    {
        console.log("Game.create")
        const [ width, height ] = this.getSceneBounds()

        this.registry.set({
            startTime: Date.now(),
            gameover: false,
            timer: 0,
            vulnerable: false,
            credits: 25000,
        })
        this.scene.launch('ui')

        this.player = this.physics.add.group()
        this.playerBullets = this.physics.add.group()
        // container group does not need physics
        this.containers = this.add.group()
        this.asteroids = this.physics.add.group()
        this.enemies = this.physics.add.group()
        this.enemyBullets = this.physics.add.group({
            classType: Bullet,
        })

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

        this.station = new Station(this, width / 2, height / 2)
        this.player.add(this.station, true)
        this.station.body.setImmovable(true)

        this.enemySpawnZone = [
            new Phaser.Geom.Rectangle(width / 2, height / 2, width - 50, height - 50),
            new Phaser.Geom.Rectangle(width / 2 + 1, height / 2 + 1, 150, 150)
        ]

        // const [ outer, inner ] = this.enemySpawnZone
        // this.add.rectangle(outer.x, outer.y, outer.width, outer.height).setStrokeStyle(1, 0xFFFFFF)
        // this.add.rectangle(inner.x, inner.y, inner.width, inner.height).setStrokeStyle(1, 0x00FFFF)

        this.beginInstability()
        this.beginSpawnAsteroids()
        this.beginSpawnEnemies()

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

        const moveTowards = (start, end, speed) => {
            const rotation = Phaser.Math.Angle.BetweenPoints(start, end)
            return this.physics.velocityFromRotation(rotation, speed)
        }

        this.events.on('upgrade', this.onUpgradePurchased, this)

        this.events.on('enemy_fire', (enemy, projectileSpeed, projectileDamage) => {
            const bullet = new Bullet(this, enemy.x, enemy.y, projectileDamage)
            this.enemyBullets.add(bullet, true)

            bullet.body.velocity = moveTowards(bullet, this.station, projectileSpeed)
        })
        
        this.physics.world.on('worldbounds', obj => {
            // Only objects with both `body.setCollideWorldBounds(true)` and `body.onWorldBounds = true` will call this event
            // assume it's a projectile
            obj.gameObject.destroy()
        })

        this.physics.add.collider(
            this.enemyBullets,
            this.station,
            (station, bullet) => {
                station.takeDamage(bullet.data.get('damage'))
                bullet.destroy()
            },
            (station, bullet) => {
                return (station.active && bullet.active)
            }
        )
    }

    getSceneBounds()
    {
        const { width, height } = this.sys.game.canvas
        return [ width, height ]
    }

    update(time, delta)
    {
        const pointer = this.input.activePointer

        // update protection time
        let timer = this.registry.get('timer')
        timer -= delta
        this.registry.set('timer', timer)

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
        const [ miningRange, miningRate ] = this.ship.data.get([ 'miningRange', 'miningRate' ])
        if (this.ship.hasCapacity())
        {
            const closest = findClosestTarget(this.ship, this.asteroids, miningRange)
            if (closest)
            {
                const asteroid = closest.obj
                const [ type, quantity, density ] = asteroid.getData([ 'type', 'quantity', 'density' ])

                const availableCapacity = this.ship.availableCapacity(type)
                const mined = Math.min((miningRate * density) * (delta / 1000), availableCapacity, quantity)
                this.ship.useCapacity(type, mined)

                if (quantity - mined <= 0)
                {
                    console.log(`Asteroid depleted`)
                    asteroid.destroy()
                }
                else
                {
                    console.log(`Mined ${mined} ${type} from asteroid (${quantity - mined} remaining)`)
                    asteroid.incData('quantity', -mined)
                }
            }
        }

        // Check for unloading containers
        let transferCapacity = this.station.data.get('transferRate') * (delta / 1000)
        const targets = findTargetsInRange(this.station, this.containers, this.station.data.get('transferRange'))
        targets.forEach(target => {
            const container = target.obj
            const [ cargoType, availableCargo ] = container.data.get([ 'cargoType', 'cargo' ])
            if (cargoType && availableCargo > 0)
            {
                const transferred = Math.min(transferCapacity, availableCargo)
    
                container.data.inc('cargo', -transferred)
                this.station.resources.inc(cargoType, transferred)
                transferCapacity -= transferred

                console.log(`Transferred ${cargoType} ${transferred} from container (${availableCargo - transferred} remaining)`)
            }
        })

        // check for end of game
        if (this.station.data.get('integrity') <= 0)
        {
            this.registry.set('gameover', true)
            this.scene.pause('game')
        }
    }

    isObjOffscreen(obj)
    {
        let offscreen = false
        const [ width, height ] = this.getSceneBounds()

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
        const [ width, height ] = this.getSceneBounds()

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

    getRandomSpawnPosition(direction)
    {
        const [ outer, inner ] = this.enemySpawnZone
        return Phaser.Geom.Rectangle.RandomOutside(outer, inner)
    }

    beginInstability()
    {
        const actual = Phaser.Math.RND.between(MIN_SHIELD_TIME, MAX_SHIELD_TIME) * 1000
        const estimated = actual + Phaser.Math.RND.between(actual / 2, actual * 2)

        console.log(`~${estimated} [${toMMSS(estimated)}] ${actual} [${toMMSS(actual)}]`)
        this.registry.set('timer', estimated)

        this.time.addEvent({
            // first instability in 2:30 to 5:00 minutes
            delay: actual,
            repeat: false,

            callback: () => {
                console.log("Vulnerable!")
                // become vulnerable
                this.station.data.set('rebooting', true)
                this.registry.set('timer', VULNERABLE_TIME * 1000)
                this.registry.set('vulnerable', true)

                this.time.addEvent({
                    delay: VULNERABLE_TIME * 1000,
                    repeat: false,
                    callback: () => {
                        console.log("Secure!")
                        this.station.data.set('rebooting', false)
                        this.registry.set('vulnerable', false)
                        this.beginInstability()
                    }
                })
            }
        })
    }

    beginSpawnAsteroids()
    {
        this.time.addEvent({
            delay: 2500,
            repeat: -1,
            callback: () => {
                const diff = Math.max(MAXIMUM_ASTEROIDS - (this.asteroids.getChildren().length), 0)
                const spawnCount = Phaser.Math.RND.between(0, diff)
                this.spawnAsteroids(spawnCount)
            }
        })
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

    beginSpawnEnemies()
    {
        this.time.addEvent({
            delay: 1000,
            repeat: -1,
            callback: () => {
                const diff = Math.max(MAXIMUM_ENEMIES - (this.enemies.getChildren().length), 0)
                const spawnCount = Phaser.Math.RND.between(0, diff)
                this.spawnEnemy(spawnCount)
            }
        })
    }

    spawnEnemy(num)
    {
        for (let index = 0; index < num; index ++)
        {
            const position = this.getRandomSpawnPosition()
            const enemy = new Enemy(this, position.x, position.y)
            this.enemies.add(enemy, true)
        }
        console.log(`Spawned ${num} enemies (total=${this.enemies.getChildren().length})`)
    }

    onUpgradePurchased(upgrade)
    {
        switch (upgrade.type)
        {
            case 'shipWeightModifier':
            {
                const maxWeight = this.ship.data.get('maxWeight')
                const newMaxWeight = Math.floor(maxWeight * upgrade.value)
                this.ship.data.set('maxWeight', newMaxWeight)
                console.log(`Increased ship maximum weight from ${maxWeight} to ${newMaxWeight}`)
                break
            }
            case 'shipMiningRateModifier':
            {
                const currentValue = this.ship.data.get('miningRate')
                const newValue = Math.floor(currentValue * upgrade.value)
                this.ship.data.set('miningRate', newValue)
                console.log(`Increased ship mining rate from ${currentValue} to ${newValue}`)
                break
            }
            case 'stationIntegrityModifier':
            {
                const [ maxIntegrity, integrity ] = this.station.data.get([ 'maxIntegrity', 'integrity' ])
                const newMaxIntegrity = Math.floor(maxIntegrity * upgrade.value)
                const diff = newMaxIntegrity - maxIntegrity
                this.station.data.set({
                    maxIntegrity: newMaxIntegrity,
                    integrity: integrity + diff
                })
                console.log(`Increased station maximum integrity from ${maxIntegrity} to ${newMaxIntegrity}`)
                break
            }
            case 'stationTransferRateModifier':
            {
                const currentValue = this.station.data.get('transferRate')
                const newValue = Math.floor(currentValue * upgrade.value)
                this.station.data.set('transferRate', newValue)
                console.log(`Increased station transfer rate from ${currentValue} to ${newValue}`)
                break
            }
            case 'stationIntegrityAddition':
            {
                const [ maxIntegrity, integrity ] = this.station.data.get([ 'maxIntegrity', 'integrity' ])
                const newIntegrity = Math.min(integrity + upgrade.value, maxIntegrity)
                this.station.data.set('integrity', newIntegrity)
                console.log(`Repaired station ${integrity} to ${newIntegrity}`)
                break
            }
            case 'spawnContainer':
            {
                const [ width, height ] = this.getSceneBounds()
                let container = new Container(this, width / 2, height / 2 + 80)
                this.player.add(container, true)
                this.containers.add(container)
                break
            }
        }
    }
}
