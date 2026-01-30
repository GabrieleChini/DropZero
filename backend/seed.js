const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { faker } = require('@faker-js/faker');
const bcrypt = require('bcryptjs');

// Load env vars
dotenv.config();

// Load Models
const User = require('./models/User');
const Meter = require('./models/Meter');
const WeeklyReading = require('./models/WeeklyReading');
const ConsumptionHistory = require('./models/ConsumptionHistory');
const Tariff = require('./models/Tariff');
const Bill = require('./models/Bill');
const TerritorialStatistic = require('./models/TerritorialStatistic');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dropzero')
    .then(() => console.log('✅ Connected to MongoDB for Seeding'))
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });

const seedData = async () => {
    try {
        console.log('🧹 Clearing existing data...');
        await Promise.all([
            User.deleteMany({}),
            Meter.deleteMany({}),
            WeeklyReading.deleteMany({}),
            ConsumptionHistory.deleteMany({}),
            Tariff.deleteMany({}),
            Bill.deleteMany({}),
            TerritorialStatistic.deleteMany({})
        ]);

        console.log('🌱 Generating Tariffs...');
        const domesticTariff = await Tariff.create({
            tariffId: 'TARIFF-DOM-2025',
            name: 'Tariffa Domestica 2025',
            type: 'DOMESTIC',
            municipality: 'Bologna',
            effectiveDate: new Date('2025-01-01'),
            baseRate: 0.12,
            fixedCharge: 10.0,
            fixedChargeWeekly: 2.31,
            consumptionBrackets: [
                { minM3: 0, maxM3: 5, ratePerM3: 0.12, description: 'Fascia base' },
                { minM3: 5, maxM3: null, ratePerM3: 0.20, description: 'Fascia eccedenza' }
            ],
            isActive: true
        });

        console.log('👤 Generating Users...');
        const users = [];
        // Create 1 Admin
        await User.create({
            email: 'admin@dropzero.com',
            password: 'password123',
            userType: 'ADMIN',
            roles: ['admin'],
            status: 'ACTIVE'
        });

        // Create 20 Users
        for (let i = 0; i < 20; i++) {
            const firstName = faker.person.firstName();
            const lastName = faker.person.lastName();
            const user = await User.create({
                email: faker.internet.email({ firstName, lastName }).toLowerCase(),
                password: 'password123', // Will be hashed by pre-save hook
                userType: 'PRIVATE',
                firstName: firstName,
                lastName: lastName,
                codiceFiscale: faker.string.alphanumeric(16).toUpperCase(),
                address: faker.location.streetAddress({ useFullAddress: true }),
                phoneNumber: faker.phone.number(),
                verified: true,
                status: 'ACTIVE',
                preferences: { theme: 'LIGHT', language: 'it' }
            });
            users.push(user);
        }

        console.log('🚰 Generating Meters & Readings...');
        for (const user of users) {
            // Create Meter
            const meter = await Meter.create({
                meterId: `SN-${faker.string.alphanumeric(8).toUpperCase()}`,
                userId: user._id,
                meterType: 'DOMESTIC',
                location: user.address,
                installationDate: faker.date.past({ years: 2 }), // Installed 2 years ago
                deviceType: 'SmartFlow-X1',
                serialNumber: faker.string.alphanumeric(10).toUpperCase(),
                status: 'ACTIVE',
                municipality: 'Trento',
                zone: faker.helpers.arrayElement([
                    'Gardolo', 'Meano', 'Bondone', 'Sardagna', 'Ravina-Romagnano',
                    'Argentario', 'Povo', 'Mattarello', 'Villazzano', 'Oltrefersina',
                    'San Giuseppe-Santa Chiara', 'Centro Storico - Piedicastello'
                ]),
                coordinates: {
                    coordinates: [
                        faker.location.longitude({ min: 11.0800, max: 11.1500 }),
                        faker.location.latitude({ min: 46.0400, max: 46.1000 })
                    ]
                }
            });

            // Generate 52 weeks (1 year) of readings
            let currentReadingVal = faker.number.int({ min: 100, max: 1000 }); // MC start
            const readings = [];

            // Random household size for this user (1-5 people)
            const householdSize = faker.number.int({ min: 1, max: 5 });
            const basePerPerson = 1.2; // Cubic meters per week per person roughly

            // Normalize Start Date to a fixed point relative to NOW, but at 00:00:00
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            for (let w = 52; w >= 0; w--) {
                // Determine week end date consistently for all users
                const weekEndDate = new Date(today);
                weekEndDate.setDate(today.getDate() - (w * 7));

                const weekStartDate = new Date(weekEndDate);
                weekStartDate.setDate(weekStartDate.getDate() - 6);

                // Seasonal consumption logic: more in summer (June-Aug), less in winter
                const month = weekEndDate.getMonth(); // 0-11
                let seasonFactor = 1.0;
                if (month >= 5 && month <= 7) seasonFactor = 1.4; // Summer +40% (gardening, showers)
                if (month === 11 || month === 0) seasonFactor = 0.9; // Winter -10%

                // Random events
                const isVacation = faker.helpers.maybe(() => true, { probability: 0.05 }); // 5% chance of vacation
                const isLeak = faker.helpers.maybe(() => true, { probability: 0.02 }); // 2% chance of leak

                let consumption = householdSize * basePerPerson * seasonFactor;

                // Add natural variance (+/- 15%)
                const variance = faker.number.float({ min: 0.85, max: 1.15 });
                consumption *= variance;

                if (isVacation) consumption *= 0.2; // Very low consumption
                if (isLeak) consumption *= 3.0; // Huge spike

                // Ensure non-negative and realistic min
                consumption = Math.max(0.1, consumption);

                const previousReading = currentReadingVal;
                currentReadingVal += consumption;

                const reading = await WeeklyReading.create({
                    readingId: `WR-${meter.meterId}-${w}`,
                    meterId: meter._id,
                    userId: user._id,
                    weekStartDate,
                    weekEndDate,
                    previousReading: parseFloat(previousReading.toFixed(2)),
                    currentReading: parseFloat(currentReadingVal.toFixed(2)),
                    volumeConsumed: Math.round(consumption * 1000), // Liters
                    volumeM3: parseFloat(consumption.toFixed(2)),
                    readingType: 'TELELETTURA',
                    cost: parseFloat((consumption * domesticTariff.baseRate).toFixed(2)) // Simplified cost
                });
                readings.push(reading);
            }

            // Generate Bill for last month
            await Bill.create({
                billId: `BILL-${faker.date.recent().getFullYear()}-${faker.string.numeric(4)}`,
                userId: user._id,
                meterId: meter._id,
                billingPeriodStart: readings[4].weekStartDate,
                billingPeriodEnd: readings[0].weekEndDate,
                billIssueDate: new Date(),
                billDueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
                billStatus: 'ISSUED',
                consumptionData: {
                    totalVolumeM3: 15,
                    totalVolumeL: 15000,
                    weekCount: 4
                },
                costBreakdown: {
                    finalAmount: 45.50
                },
                tariffApplied: domesticTariff._id
            });
        }

        console.log('✅ Seeding Completed Successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding Failed:', error);
        process.exit(1);
    }
};

seedData();
