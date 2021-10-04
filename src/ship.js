import Phaser from 'phaser'
import { Resources } from './defines'


const BASE_MAX_SPEED = 150
const BASE_MAX_WEIGHT = 3000
const BASE_MINING_RATE = 40
const BASE_MINING_RANGE = 180


export class Ship extends Phaser.GameObjects.Container
{
    constructor(scene, x, y)
    {
        super(scene, x, y)

        this.setDepth(10)

        this.data = new Phaser.Data.DataManager(this)
        this.data.set({
            integrity: 100,
            maxSpeed: BASE_MAX_SPEED,
            maxWeight: BASE_MAX_WEIGHT,
            rotationSpeed: 200,
            miningRange: BASE_MINING_RANGE,
            miningRate: BASE_MINING_RATE,
        })

        this.nextRotation = this.rotation

        this.hull = this.scene.add.triangle(0, 0, 10, 5, 0, 10, 0, 0, 0x000000, 1)
        this.hull.setStrokeStyle(1, 0xAAAAAA, 1)
        this.add(this.hull)

        this.setSize(10, 10)

        this.positionHistory = []
        this.containers = []
    }

    get speed()
    {
        const maxWeight = this.data.get('maxWeight')
        const cargoWeight = this.getCargoWeight()
        const adjustment = ((maxWeight - cargoWeight) / maxWeight)
        const speed = this.data.get('maxSpeed') * adjustment
        return speed
    }

    get rotationSpeed()
    {
        return this.data.get('rotationSpeed')
    }

    preUpdate()
    {
        this.positionHistory.push({
            x: this.x,
            y: this.y,
            r: this.rotation
        })

        if (this.positionHistory.length > 100)
        {
            this.positionHistory.shift()
        }
    }

    isAlive()
    {
        return this.active
    }

    getCapacityTakenPercent()
    {
        let val = null
        if (this.containers.length > 0)
        {
            let maxCargo = 0
            let totalCargo = 0
            this.containers.forEach(container => {
                maxCargo += container.data.get('capacity')
                totalCargo += container.data.get('cargo')
            })

            val = (totalCargo / maxCargo) * 100
        }

        return val
    }

    getCargoWeight()
    {
        return this.containers.reduce((val, cur, index, items) => {
            return val + cur.getData('weight') + cur.getData('cargo')
        }, 0)
    }

    attach(container)
    {
        const offset = 20 + (20 * this.containers.length)
        this.containers.push(container)
        container.attachTo(this, offset)
    }

    detach(container)
    {
        if (container == undefined)
        {
            // Just drop the last container
            if (this.containers.length > 0)
            {
                container = this.containers.pop()
            }
        }
        else
        {
            const index = this.containers.indexOf(container)
            this.containers.splice(index, 1)
        }

        if (container)
        {
            container.detachFrom(this)
        }

        return container
    }

    getAttachedPosition(index)
    {
        let position
        if (this.positionHistory.length - index > 0)
        {
            index = Math.max(this.positionHistory.length - index, 0)
            position = this.positionHistory[index]
        }
        else
        {
            position = {
                x: this.x - 20,
                y: this.y,
                r: this.rotation
            }
        }

        return position
    }

    hasCapacity(type)
    {
        return this.availableCapacity(type) > 0
    }

    availableCapacity(type)
    {
        const containers = this.containers.filter(container => {
            const [ cargoType, cargo, capacity ] = container.getData([ 'cargoType', 'cargo', 'capacity' ])
            return cargoType == null || type == null || (cargoType === type && cargo < capacity)
        })

        const available = containers.reduce((val, item, index, items) => {
            const [ cargo, capacity ] = item.getData([ 'cargo', 'capacity' ])
            return val + (capacity - cargo)
        }, 0)

        // console.log(`Ship has ${available} available space for ${type || 'any'}`)
        return available
    }

    useCapacity(type, amount)
    {
        // Find all containers that have space for the resource
        const containers = this.containers.filter(container => {
            const [ cargoType, cargo, capacity ] = container.getData([ 'cargoType', 'cargo', 'capacity' ])
            return cargoType == null || (cargoType === type && cargo < capacity)
        })

        containers.forEach(container => {
            const [ cargo, capacity ] = container.getData([ 'cargo', 'capacity' ])
            const transfer = Math.min(capacity - cargo, amount)
            container.setData('cargoType', type)
            container.incData('cargo', amount)
            amount -= transfer
        })

        console.assert(amount === 0, "Failed to transfer all resources to containers")
    }
}

export class Container extends Phaser.GameObjects.Container
{
    constructor(scene, x, y)
    {
        super(scene, x, y)

        this.setDepth(8)

        this.data = new Phaser.Data.DataManager(this)
        this.data.set({
            integrity: 100,
            weight: 80,
            capacity: 1000,
            cargo: 0,
            cargoType: undefined,
        })
        this.attachedTo = null

        this.hull = this.scene.add.rectangle(0, 0, 10, 5, 0x000000, 1)
        this.hull.setStrokeStyle(1, 0xAAAAAA, 1)
        this.add(this.hull)

        this.cargo = this.scene.add.rectangle(0, 0, 8, 3, 0xFFFFFF, 1)
        this.cargo.setScale(0, 1)
        this.add(this.cargo)

        const redrawCargo = () => {
            const [ capacity, cargo, cargoType ] = this.data.get([ 'capacity', 'cargo', 'cargoType' ])

            const color = Resources[cargoType]?.color || 0xFFFFFF
            this.cargo.setFillStyle(color, 1)

            this.cargo.setScale(cargo / capacity, 1)
        }

        this.on('changedata-capacity', () => {
            redrawCargo()
        })
        this.on('changedata-cargo', (obj, val, prev) => {
            if (val === 0)
            {
                this.setData('cargoType', undefined)
            }

            redrawCargo()
        })

        this.setSize(10, 10)
    }

    preUpdate()
    {
        if (this.attachedTo)
        {
            // Rotate to the attached item
            const rotation = Phaser.Math.Angle.BetweenPoints(this, this.attachedTo)
            // this.physics.velocityFromRotation(rotation, this.attachTo.speed)
            this.rotation = Phaser.Math.Angle.RotateTo(this.rotation, rotation, 0.025)

            // const { x, y } = this.attachedTo
            // // this.x = x + 50 * Math.cos(this.rotation)
            // // this.y = y + 50 * Math.sin(this.rotation)

            // const length = 50 // Math.pow(x, 2) + Math.pow(y, 2)
            // const pos = new Phaser.Math.Vector2(x, y)
            // pos.rotate(this.angle)
            // // pos.setLength(length)
            // this.x = x + pos.x
            // this.y = y + pos.y

            // move towards the player if not too close
            // const distance = Phaser.Math.Distance.BetweenPoints(this, this.attachedTo)
            // console.log(distance)
            // if (distance > 14)
            // {
            //     this.scene.physics.velocityFromRotation(this.rotation, this.attachedTo.data.get('speed'), this.body.velocity)
            // }
            // else
            // {
            //     this.body.velocity.x = 0
            //     this.body.velocity.y = 0
            // }

            const point = new Phaser.Math.Vector2(this.attachedTo)
            Phaser.Math.RotateAroundDistance(point, point.x, point.y, (this.attachedTo.rotation), this.attachOffset);
            this.setPosition(point.x, point.y)


            // const position = this.attachedTo.getAttachedPosition(this.positionLag)

            // // if (Phaser.Math.Distance.BetweenPoints(this, position) > 4)
            // {
            //     this.x = position.x
            //     this.y = position.y
            //     this.rotation = position.r
            // }
        }
    }

    isAlive()
    {
        return this.active
    }

    attachTo(other, offset)
    {
        this.attachedTo = other
        this.attachOffset = -offset

        // const position = this.attachedTo.getAttachedPosition(this.positionLag)
        // this.x = position.x
        // this.y = position.y
        // this.rotation = position.r
    }

    detachFrom(other)
    {
        this.setPosition(this.attachedTo.x, this.attachedTo.y)
        this.attachedTo = undefined
        this.attachOffset = undefined
    }
}