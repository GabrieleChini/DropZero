const WeeklyReading = require('../models/WeeklyReading');
const ConsumptionHistory = require('../models/ConsumptionHistory');
const Bill = require('../models/Bill');

// @desc    Get dashboard stats (last reading, trend, estimated cost)
// @route   GET /api/readings/dashboard/:userId
// @access  Private
// @desc    Get dashboard stats (last reading, trend, estimated cost)
// @route   GET /api/readings/dashboard/:userId
// @access  Private
exports.getDashboardStats = async (req, res) => {
    try {
        const userId = req.params.userId;

        // Get last 5 readings to calculate trend and average
        const readings = await WeeklyReading.find({ userId })
            .sort({ weekEndDate: -1 })
            .limit(5);

        if (!readings || readings.length === 0) {
            return res.status(200).json({
                hasData: false,
                currentConsumption: 0,
                trendPercentage: 0,
                estimatedCost: 0,
                suggestions: []
            });
        }

        const current = readings[0];
        const previous = readings.length > 1 ? readings[1] : null;

        // Calculate Trend (vs previous week)
        let trend = 0;
        if (previous && previous.volumeConsumed > 0) {
            trend = ((current.volumeConsumed - previous.volumeConsumed) / previous.volumeConsumed) * 100;
        }

        // Calculate Average (last 4 weeks)
        const totalVol = readings.reduce((acc, r) => acc + r.volumeConsumed, 0);
        const avgVol = totalVol / readings.length;

        // Suggestion Logic (Enhanced)
        const suggestions = [];

        // 1. Trend Analysis
        if (trend > 20) {
            suggestions.push({ type: 'warning', title: 'Picco di Consumo', text: `Attenzione: hai consumato il ${trend.toFixed(0)}% in più rispetto alla settimana scorsa.` });
        } else if (trend < -10) {
            suggestions.push({ type: 'success', title: 'Ottimo Risparmio', text: `Hai ridotto i consumi del ${Math.abs(trend).toFixed(0)}%. Continua così!` });
        }

        // 2. Average Comparison
        if (current.volumeM3 > avgVol * 1.5) {
            suggestions.push({ type: 'warning', title: 'Sopra la Media', text: 'Stai consumando molto più della tua media mensile. Controlla eventuali perdite.' });
        }

        // 3. Absolute Check
        if (current.volumeM3 > 10) { // arbitrary high threshold for a week
            suggestions.push({ type: 'warning', title: 'Consumo Elevato', text: 'Hai superato i 10 metri cubi questa settimana. Valuta di ridurre l\'irrigazione.' });
        }

        // 4. General Tips (Randomized if few specific alerts)
        if (suggestions.length < 2) {
            const tips = [
                { type: 'info', title: 'Lo sapevi?', text: 'Utilizzare la lavastoviglie a pieno carico risparmia fino a 40 litri rispetto al lavaggio a mano.' },
                { type: 'info', title: 'Risparmio Doccia', text: 'Chiudere l\'acqua mentre ti insaponi può far risparmiare 20 litri ogni doccia.' },
                { type: 'info', title: 'Controllo Perdite', text: 'Un rubinetto che gocciola può sprecare fino a 5.000 litri d\'acqua all\'anno.' },
                { type: 'success', title: 'Obiettivo Eco', text: 'Hai mantenuto un consumo stabile. Ottimo per l\'ambiente!' }
            ];
            // Add a random tip not already present (simplified)
            suggestions.push(tips[Math.floor(Math.random() * tips.length)]);
        }

        res.json({
            hasData: true,
            currentConsumption: current.volumeConsumed,
            lastReadingDate: current.weekEndDate,
            trendPercentage: trend.toFixed(1),
            estimatedCost: current.cost,
            suggestions: suggestions.slice(0, 3) // Return max 3 suggestions
        });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Add a manual reading
// @route   POST /api/readings
// @access  Private
exports.addReading = async (req, res) => {
    try {
        const { userId, readingValue, date } = req.body;

        // 1. Find Meter
        const meter = await require('../models/Meter').findOne({ userId, status: 'ACTIVE' });
        if (!meter) {
            return res.status(404).json({ message: 'Nessun contatore attivo trovato per questo utente.' });
        }

        // 2. Find Last Reading
        const lastReading = await WeeklyReading.findOne({ meterId: meter._id }).sort({ currentReading: -1 });

        const previousReadingVal = lastReading ? lastReading.currentReading : 0;

        // 3. Validate
        if (readingValue < previousReadingVal) {
            return res.status(400).json({ message: `La nuova lettura non può essere inferiore alla precedente (${previousReadingVal}).` });
        }

        const consumptionM3 = readingValue - previousReadingVal;
        const consumptionLiters = Math.round(consumptionM3 * 1000);

        // Cost Approx (1.5 EUR/m3)
        const cost = parseFloat((consumptionM3 * 1.5).toFixed(2));

        // Date Handling
        // If we have a last reading, this reading covers from last date to now.
        // If not, it's a starting point (consumption 0? or logic implies valid prev).
        // For simulation continuity, let's assume valid prev exists from seed.

        const startDate = lastReading ? lastReading.weekEndDate : new Date(new Date(date).setDate(new Date(date).getDate() - 7));

        const newReading = await WeeklyReading.create({
            readingId: `MN-${Date.now()}`, // Manual ID
            meterId: meter._id,
            userId,
            weekStartDate: startDate,
            weekEndDate: new Date(date),
            readingDate: new Date(),
            previousReading: previousReadingVal,
            currentReading: parseFloat(readingValue),
            volumeConsumed: consumptionLiters,
            volumeM3: parseFloat(consumptionM3.toFixed(2)),
            readingType: 'MANUALE',
            cost,
            dataQuality: 'VALID'
        });

        res.status(201).json(newReading);

    } catch (error) {
        console.error("Error adding reading:", error);
        res.status(500).json({ message: 'Errore durante il salvataggio.', error: error.message });
    }
};

// @desc    Get reading history
// @route   GET /api/readings/history/:userId
// @access  Private
exports.getHistory = async (req, res) => {
    try {
        const userId = req.params.userId;
        // Simple pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const readings = await WeeklyReading.find({ userId })
            .sort({ weekEndDate: -1 })
            .skip(skip)
            .limit(limit);

        const total = await WeeklyReading.countDocuments({ userId });

        res.json({
            readings,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalReadings: total
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get chart data (last 12 weeks)
// @route   GET /api/readings/chart/:userId
// @access  Private
exports.getChartData = async (req, res) => {
    try {
        const userId = req.params.userId;
        const timeframe = req.query.timeframe || '90days';

        let limit = 12; // Default 90 days (approx 12 weeks)
        if (timeframe === '1year') {
            limit = 52;
        }

        const readings = await WeeklyReading.find({ userId })
            .sort({ weekEndDate: -1 }) // Newest first
            .limit(limit);

        // Reverse to show chronologically (Oldest -> Newest) on chart
        const data = readings.reverse().map(r => ({
            name: new Date(r.weekEndDate).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }),
            litri: r.volumeConsumed,
            cost: r.cost
        }));

        res.json(data);
    } catch (error) {
    }
};

// @desc    Get detailed advice list
// @route   GET /api/readings/advice/:userId
// @access  Private
exports.getAdvice = async (req, res) => {
    try {
        const userId = req.params.userId;
        const readings = await WeeklyReading.find({ userId }).sort({ weekEndDate: -1 }).limit(4);

        const adviceList = [];

        // 1. Analyze Trend
        if (readings.length >= 2) {
            const current = readings[0];
            const previous = readings[1];
            const trend = ((current.volumeConsumed - previous.volumeConsumed) / previous.volumeConsumed) * 100;

            if (trend > 15) {
                adviceList.push({
                    id: 'trend-alert',
                    category: 'URGENTE',
                    title: 'Picco di Consumo Rilevato',
                    description: `Hai consumato il ${trend.toFixed(0)}% in più questa settimana. Controlla se hai ospiti o perdite occulte.`,
                    impact: 'Alto',
                    icon: 'AlertTriangle',
                    color: 'text-rose-600 bg-rose-50'
                });
            }
        }

        // 2. Seasonal Advice (Simulated based on date)
        const month = new Date().getMonth();
        if (month >= 5 && month <= 8) { // Summer
            adviceList.push({
                id: 'season-summer',
                category: 'STAGIONALE',
                title: 'Irrigazione Intelligente',
                description: 'Annaffia il giardino la sera tardi per ridurre l\'evaporazione del 30%.',
                impact: 'Medio',
                icon: 'Sun',
                color: 'text-amber-600 bg-amber-50'
            });
        }

        // 3. Static Educational Advice
        adviceList.push(
            {
                id: 'edu-1',
                category: 'ABITUDINI',
                title: 'Riduci il tempo della doccia',
                description: 'Accorciare la doccia di 2 minuti fa risparmiare fino a 300 litri al mese.',
                impact: 'Medio',
                icon: 'Droplets',
                color: 'text-sky-600 bg-sky-50'
            },
            {
                id: 'edu-2',
                category: 'ELETTRODOMESTICI',
                title: 'Lavastoviglie e Lavatrice',
                description: 'Usale solo a pieno carico. Risparmierai acqua ed energia elettrica.',
                impact: 'Alto',
                icon: 'Zap',
                color: 'text-violet-600 bg-violet-50'
            },
            {
                id: 'edu-3',
                category: 'MANUTENZIONE',
                title: 'Controlla i rubinetti',
                description: 'Un rubinetto che perde 10 gocce al minuto spreca 2.000 litri all\'anno.',
                impact: 'Basso',
                icon: 'Wrench',
                color: 'text-slate-600 bg-slate-50'
            },
            {
                id: 'edu-4',
                category: 'CUCINA',
                title: 'Lavaggio Verdure',
                description: 'Lava le verdure in una bacinella invece che sotto l\'acqua corrente.',
                impact: 'Basso',
                icon: 'Leaf',
                color: 'text-emerald-600 bg-emerald-50'
            }
        );

        res.json(adviceList);

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
