import Phaser from 'phaser'
import { Resources } from './defines'


const BASE_MAX_SPEED = 150
const BASE_MAX_WEIGHT = 3000
const BASE_MINING_RATE = 40
const BASE_MINING_RANGE = 30


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

    getCargoWeight()
    {
        return this.containers.reduce((val, cur, index, items) => {
            return val + cur.getData('weight') + cur.getData('cargo')
        }, 0)
    }

    attach(container)
    {
        const lag = 20 + (20 * this.containers.length)
        this.containers.push(container)
        container.attachTo(this, lag)
    }

    detach()
    {
        let container
        if (this.containers.length > 0)
        {
            container = this.containers.pop()
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
            const position = this.attachedTo.getAttachedPosition(this.positionLag)

            // if (Phaser.Math.Distance.BetweenPoints(this, position) > 4)
            {
                this.x = position.x
                this.y = position.y
                this.rotation = position.r
            }
        }
    }

    isAlive()
    {
        return this.active
    }

    attachTo(other, lag)
    {
        this.attachedTo = other
        this.positionLag = lag

        const position = this.attachedTo.getAttachedPosition(this.positionLag)
        this.x = position.x
        this.y = position.y
        this.rotation = position.r
    }

    detachFrom(other)
    {
        this.attachedTo = undefined
        this.positionLag = undefined
    }
}