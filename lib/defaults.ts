import { QualifyingStandards, TimeStandard } from "./types";

// Helper to parse "MM:SS.HH" or "SS.HH" to ms
function p(timeStr: string): number {
    const parts = timeStr.split(':');
    let minutes = 0;
    let seconds = 0;
    let hundredths = 0;

    if (parts.length === 2) {
        minutes = parseInt(parts[0], 10);
        const secParts = parts[1].split('.');
        seconds = parseInt(secParts[0], 10);
        hundredths = parseInt(secParts[1] || '0', 10);
    } else {
        const secParts = parts[0].split('.');
        seconds = parseInt(secParts[0], 10);
        hundredths = parseInt(secParts[1] || '0', 10);
    }
    return (minutes * 60000) + (seconds * 1000) + (hundredths * 10);
}

const ESSEX_2026_TIMES: TimeStandard = {
    'M': {
        '10 & 11': {
            'Freestyle50': p('36.47'), 'Freestyle100': p('1:21.20'), 'Freestyle200': p('2:56.60'), 'Freestyle400': p('6:03.30'),
            'Backstroke50': p('42.40'), 'Backstroke100': p('1:33.90'), 'Backstroke200': p('3:20.30'),
            'Breaststroke50': p('48.10'),
            'Breaststroke100': p('1:45.00'), 'Breaststroke200': p('3:45.00'),
            'Butterfly50': p('40.00'), 'Butterfly100': p('1:30.00'), 'Butterfly200': p('3:20.00'),
            'Individual Medley200': p('3:15.00')
        },
        '12': {
            'Freestyle50': p('35.52'), 'Freestyle100': p('1:19.95'), 'Freestyle200': p('2:49.65'), 'Freestyle400': p('5:53.65'),
            'Backstroke50': p('41.85'), 'Backstroke100': p('1:30.45'), 'Backstroke200': p('3:08.05'),
            'Breaststroke50': p('48.05'),
            'Breaststroke100': p('1:44.00'), 'Breaststroke200': p('3:40.00'),
            'Butterfly50': p('39.00'), 'Butterfly100': p('1:28.00'), 'Butterfly200': p('3:15.00'),
            'Individual Medley200': p('3:10.00')
        },
        '13': {
            'Freestyle50': p('33.89'), 'Freestyle100': p('1:14.50'), 'Freestyle200': p('2:38.00'), 'Freestyle400': p('5:39.55'),
            'Backstroke50': p('38.60'), 'Backstroke100': p('1:27.05'), 'Backstroke200': p('3:02.40'),
            'Breaststroke50': p('46.35'),
            'Breaststroke100': p('1:40.00'), 'Breaststroke200': p('3:35.00'),
            'Butterfly50': p('37.00'), 'Butterfly100': p('1:25.00'), 'Butterfly200': p('3:10.00'),
            'Individual Medley200': p('3:00.00')
        },
        '14': {
            'Freestyle50': p('31.10'), 'Freestyle100': p('1:08.95'), 'Freestyle200': p('2:27.75'), 'Freestyle400': p('5:15.85'),
            'Backstroke50': p('35.90'), 'Backstroke100': p('1:19.30'), 'Backstroke200': p('2:52.75'),
            'Breaststroke50': p('43.25'),
            'Breaststroke100': p('1:35.00'), 'Breaststroke200': p('3:25.00'),
            'Butterfly50': p('34.00'), 'Butterfly100': p('1:15.00'), 'Butterfly200': p('2:50.00'),
            'Individual Medley200': p('2:45.00')
        },
        '15': {
            'Freestyle50': p('29.95'), 'Freestyle100': p('1:07.24'), 'Freestyle200': p('2:22.05'), 'Freestyle400': p('5:13.40'),
            'Backstroke50': p('35.60'), 'Backstroke100': p('1:17.15'), 'Backstroke200': p('2:43.90'),
            'Breaststroke50': p('40.05'),
            'Breaststroke100': p('1:30.00'), 'Breaststroke200': p('3:15.00'),
            'Butterfly50': p('32.00'), 'Butterfly100': p('1:12.00'), 'Butterfly200': p('2:45.00'),
            'Individual Medley200': p('2:40.00')
        },
        '16': {
            'Freestyle50': p('27.70'), 'Freestyle100': p('1:07.20'), 'Freestyle200': p('2:17.60'), 'Freestyle400': p('5:05.30'),
            'Backstroke50': p('33.45'), 'Backstroke100': p('1:13.35'), 'Backstroke200': p('2:38.90'),
            'Breaststroke50': p('37.21'),
            'Breaststroke100': p('1:22.00'), 'Breaststroke200': p('3:00.00'),
            'Butterfly50': p('30.00'), 'Butterfly100': p('1:08.00'), 'Butterfly200': p('2:35.00'),
            'Individual Medley200': p('2:30.00')
        },
        '17': {
            'Freestyle50': p('27.70'), 'Freestyle100': p('1:07.20'), 'Freestyle200': p('2:17.60'), 'Freestyle400': p('5:05.30'),
            'Backstroke50': p('33.45'), 'Backstroke100': p('1:13.35'), 'Backstroke200': p('2:38.90'),
            'Breaststroke50': p('37.21'),
            'Breaststroke100': p('1:22.00'), 'Breaststroke200': p('3:00.00'),
            'Butterfly50': p('30.00'), 'Butterfly100': p('1:08.00'), 'Butterfly200': p('2:35.00'),
            'Individual Medley200': p('2:30.00')
        },
        '18+': {
            'Freestyle50': p('27.70'), 'Freestyle100': p('1:07.20'), 'Freestyle200': p('2:17.60'), 'Freestyle400': p('5:05.30'),
            'Backstroke50': p('33.45'), 'Backstroke100': p('1:13.35'), 'Backstroke200': p('2:38.90'),
            'Breaststroke50': p('37.21'),
            'Breaststroke100': p('1:22.00'), 'Breaststroke200': p('3:00.00'),
            'Butterfly50': p('30.00'), 'Butterfly100': p('1:08.00'), 'Butterfly200': p('2:35.00'),
            'Individual Medley200': p('2:30.00')
        },
    },
    'F': {
        '10 & 11': {
            'Freestyle50': p('36.66'), 'Freestyle100': p('1:23.30'), 'Freestyle200': p('3:00.20'), 'Freestyle400': p('6:29.30'),
            'Backstroke50': p('43.25'), 'Backstroke100': p('1:33.50'), 'Backstroke200': p('3:41.65'),
            'Breaststroke50': p('49.40'),
            'Breaststroke100': p('1:48.00'), 'Breaststroke200': p('3:50.00'),
            'Butterfly50': p('41.00'), 'Butterfly100': p('1:35.00'), 'Butterfly200': p('3:30.00'),
            'Individual Medley200': p('3:25.00')
        },
        '12': {
            'Freestyle50': p('34.55'), 'Freestyle100': p('1:20.30'), 'Freestyle200': p('2:51.25'), 'Freestyle400': p('5:45.75'),
            'Backstroke50': p('41.20'), 'Backstroke100': p('1:31.75'), 'Backstroke200': p('3:18.00'),
            'Breaststroke50': p('47.70'),
            'Breaststroke100': p('1:45.00'), 'Breaststroke200': p('3:45.00'),
            'Butterfly50': p('38.00'), 'Butterfly100': p('1:30.00'), 'Butterfly200': p('3:20.00'),
            'Individual Medley200': p('3:15.00')
        },
        '13': {
            'Freestyle50': p('33.05'), 'Freestyle100': p('1:14.95'), 'Freestyle200': p('2:43.20'), 'Freestyle400': p('5:44.10'),
            'Backstroke50': p('39.60'), 'Backstroke100': p('1:25.70'), 'Backstroke200': p('3:06.60'),
            'Breaststroke50': p('44.40'),
            'Breaststroke100': p('1:40.00'), 'Breaststroke200': p('3:35.00'),
            'Butterfly50': p('36.00'), 'Butterfly100': p('1:25.00'), 'Butterfly200': p('3:10.00'),
            'Individual Medley200': p('3:05.00')
        },
        '14': {
            'Freestyle50': p('32.05'), 'Freestyle100': p('1:09.40'), 'Freestyle200': p('2:28.35'), 'Freestyle400': p('5:16.60'),
            'Backstroke50': p('37.15'), 'Backstroke100': p('1:19.35'), 'Backstroke200': p('2:50.15'),
            'Breaststroke50': p('42.80'),
            'Breaststroke100': p('1:35.00'), 'Breaststroke200': p('3:25.00'),
            'Butterfly50': p('35.00'), 'Butterfly100': p('1:20.00'), 'Butterfly200': p('3:00.00'),
            'Individual Medley200': p('2:55.00')
        },
        '15': {
            'Freestyle50': p('31.20'), 'Freestyle100': p('1:08.35'), 'Freestyle200': p('2:25.90'), 'Freestyle400': p('5:10.00'),
            'Backstroke50': p('36.50'), 'Backstroke100': p('1:18.90'), 'Backstroke200': p('2:49.25'),
            'Breaststroke50': p('42.75'),
            'Breaststroke100': p('1:33.00'), 'Breaststroke200': p('3:22.00'),
            'Butterfly50': p('34.50'), 'Butterfly100': p('1:19.00'), 'Butterfly200': p('2:58.00'),
            'Individual Medley200': p('2:52.00')
        },
        '16': {
            'Freestyle50': p('30.90'), 'Freestyle100': p('1:08.20'), 'Freestyle200': p('2:25.60'), 'Freestyle400': p('5:08.85'),
            'Backstroke50': p('36.10'), 'Backstroke100': p('1:18.60'), 'Backstroke200': p('2:46.20'),
            'Breaststroke50': p('42.05'),
            'Breaststroke100': p('1:32.00'), 'Breaststroke200': p('3:20.00'),
            'Butterfly50': p('34.00'), 'Butterfly100': p('1:18.00'), 'Butterfly200': p('2:55.00'),
            'Individual Medley200': p('2:50.00')
        },
        '17': {
            'Freestyle50': p('30.90'), 'Freestyle100': p('1:08.20'), 'Freestyle200': p('2:25.60'), 'Freestyle400': p('5:08.85'),
            'Backstroke50': p('36.10'), 'Backstroke100': p('1:18.60'), 'Backstroke200': p('2:46.20'),
            'Breaststroke50': p('42.05'),
            'Breaststroke100': p('1:32.00'), 'Breaststroke200': p('3:20.00'),
            'Butterfly50': p('34.00'), 'Butterfly100': p('1:18.00'), 'Butterfly200': p('2:55.00'),
            'Individual Medley200': p('2:50.00')
        },
        '18+': {
            'Freestyle50': p('30.90'), 'Freestyle100': p('1:08.20'), 'Freestyle200': p('2:25.60'), 'Freestyle400': p('5:08.85'),
            'Backstroke50': p('36.10'), 'Backstroke100': p('1:18.60'), 'Backstroke200': p('2:46.20'),
            'Breaststroke50': p('42.05'),
            'Breaststroke100': p('1:32.00'), 'Breaststroke200': p('3:20.00'),
            'Butterfly50': p('34.00'), 'Butterfly100': p('1:18.00'), 'Butterfly200': p('2:55.00'),
            'Individual Medley200': p('2:50.00')
        },
    }
};

// Create derived standards for Regional/National (estimates)
function scaleStandards(base: TimeStandard, factor: number): TimeStandard {
    const scaled: TimeStandard = {};
    for (const sex in base) {
        scaled[sex] = {};
        for (const age in base[sex]) {
            scaled[sex][age] = {};
            for (const event in base[sex][age]) {
                scaled[sex][age][event] = Math.round(base[sex][age][event] * factor);
            }
        }
    }
    return scaled;
}

export const DEFAULT_QT_DB: QualifyingStandards = {
    County: {
        name: 'Essex',
        year: 2026,
        times: ESSEX_2026_TIMES
    },
    Regional: {
        name: 'East Region',
        year: 2026,
        times: (() => {
            const scaled = scaleStandards(ESSEX_2026_TIMES, 0.95);
            // Manual override for specific known times
            if (scaled['M'] && scaled['M']['13']) {
                scaled['M']['13']['Freestyle50'] = p('30.00');
            }
            return scaled;
        })()
    },
    National: {
        name: 'Swim England',
        year: 2026,
        times: scaleStandards(ESSEX_2026_TIMES, 0.90) // Estimate
    }
};
