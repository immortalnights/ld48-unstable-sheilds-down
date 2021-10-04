
export const toMMSS = ms => {
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


export const soundLimiter = function(sound, volume=1, delay=100) {
    let skip = false
    return function(config) {
        // volume = config?.volume || 1
        // delay = config?.delay || 100

        if (skip === false)
        {
            sound.play({
                volume
            })
            skip = true
            setTimeout(() => {
                skip = false
            }, delay)
        }
    }
}


export const getRandomDirection = () => {
    return Phaser.Math.RND.pick([ 'top', 'right', 'bottom', 'left' ])
}


export const getOppositeDirection = direction => {
    let otherDirection
    switch (direction)
    {
        case 'top':
        {
            otherDirection = 'bottom'
            break
        }
        case 'right':
        {
            otherDirection = 'left'
            break
        }
        case 'bottom':
        {
            otherDirection = 'top'
            break
        }
        case 'left':
        {
            otherDirection = 'right'
            break
        }
    }

    return otherDirection
}


export const findTargetsInRange = (origin, others, range) => {
    if (others instanceof Phaser.GameObjects.Group)
    {
        others = others.getChildren()
    }
    else if (!Array.isArray(others))
    {
        others = [ others ]
    }

    origin = origin.parentContainer || origin

    const inRange = []
    others.forEach(obj => {
        if (obj.isAlive())
        {
            const distance = Phaser.Math.Distance.BetweenPoints(origin, obj)
            // console.log(`Other is ${distance} from origin`)
            if (range == null || distance <= range)
            {
                inRange.push({
                    distance,
                    obj
                })
            }
        }
    })

    return inRange
}


export const findClosestTarget = (origin, others, range) => {
    const inRange = findTargetsInRange(origin, others, range)
    let closest

    inRange.forEach(obj => {
        if (closest == null || obj.distance < closest.distance)
        {
            closest = obj
        }
    })

    return closest
}