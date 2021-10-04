

export const Resources = {
    copper: {
        min: 2000,
        max: 5000,
        value: 2,
        // lower density, faster mining
        density: 0.5,
        color: 0xff9800,
    },
    iron: {
        min: 1000,
        max: 3000,
        value: 6,
        density: 1,
        color: 0x607d8b,
    },
    coal: {
        min: 500,
        max: 1000,
        value: 4,
        density: 0.25,
        color: 0x222222,
    },
    titanium: {
        min: 200,
        max: 800,
        value: 10,
        density: 1.25,
        color: 0x03a9f4,
    },
    gold: {
        min: 50,
        max: 200,
        value: 40,
        density: 2,
        color: 0xffd700
    }
}


export const Upgrades = [
    {
        id: 'shipweight',
        name: "Ship Weight",
        valueLabel: "Weight",
        category: 'ship',
        cost: 100,
        costMultiplier: 1.15,
        type: 'shipWeightModifier',
        value: 1.05,
    },
    {
        id: 'shipminingrate',
        name: "Ship Mining Rate",
        valueLabel: "Rate",
        category: 'ship',
        cost: 100,
        costMultiplier: 1.15,
        type: 'shipMiningRateModifier',
        value: 1.05,
    },
    {
        id: 'stationintegrity',
        name: "Station Integrity",
        valueLabel: "Integrity",
        category: 'station',
        cost: 100,
        costMultiplier: 1.15,
        type: 'stationIntegrityModifier',
        value: 1.075,
    },
    {
        id: 'stationtransferrate',
        name: "Station Transfer Rate",
        valueLabel: "Rate",
        category: 'station',
        cost: 100,
        costMultiplier: 1.15,
        type: 'stationTransferRateModifier',
        value: 1.05,
    },
    {
        id: 'stationrepair',
        name: "Station Repair",
        valueLabel: "Integrity",
        category: 'special',
        cost: 100,
        costMultiplier: 1.15,
        type: 'stationIntegrityAddition',
        value: 120,
    },
    {
        id: 'newcontainer',
        name: "New Container",
        valueLabel: "Containers",
        category: 'special',
        cost: 2000,
        costMultiplier: 1.75,
        type: 'spawnContainer',
        value: 1,
    },
]