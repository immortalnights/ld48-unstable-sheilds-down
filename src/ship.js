import Phaser from 'phaser'

export class Ship extends Phaser.GameObjects.Container
{
    constructor(scene, x, y)
    {
        super(scene, x, y)

        this.setDepth(10)

        this.data = new Phaser.Data.DataManager(this)
        this.data.set({
            integrity: 100,
            maxSpeed: 150,
            maxWeight: 3000,
            rotationSpeed: 200,
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
            cargoType: '',
        })
        this.attachedTo = null

        this.hull = this.scene.add.rectangle(0, 0, 10, 5, 0x000000, 1)
        this.hull.setStrokeStyle(1, 0xAAAAAA, 1)
        this.add(this.hull)

        this.cargo = this.scene.add.rectangle(0, 0, 8, 3, 0xFFFFFF, 1)
        this.cargo.setScale(0, 1)
        this.add(this.cargo)

        const redrawCargo = () => {
            const [ capacity, cargo ] = this.data.get([ 'capacity', 'cargo' ])
            this.cargo.setScale(cargo / capacity, 1)
        }

        this.on('changedata-capacity', () => {
            redrawCargo()
        })
        this.on('changedata-cargo', () => {
            redrawCargo()
        })

        this.setSize(10, 10)
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
}