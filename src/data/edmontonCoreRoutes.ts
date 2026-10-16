// Core Edmonton transit routes bounded roughly by 118 Ave (N), 63 Ave (S), 142 St (W), 75 St (E)
// Real track and road geometries normalized to percentage viewport coordinates.

export interface PathNode {
  xPct: number;
  yPct: number;
}

export interface Station {
  id: string;
  name?: string;
  xPct: number;
  yPct: number;
  glow: number;
}

export interface VehicleState {
  progress: number; // 0..1 along path, or negative while waiting
  speed: number;
  length: number;
  active: boolean;
  cooldown: number;
  maxCooldown: number;
}

export interface CoreTransitRoute {
  id: string;
  name: string;
  color: string;
  strokeWidth: number;
  path: PathNode[];
  stations: Station[];
  trains: VehicleState[];
}

export const EDMONTON_CORE_ROUTES: CoreTransitRoute[] = [
  {
    "id": "021R",
    "name": "Capital Line LRT",
    "color": "#22c55e",
    "strokeWidth": 9,
    "speed": 0.0028,
    "trainLength": 0.16,
    "path": [
      {
        "xPct": 39.7,
        "yPct": 108.0
      },
      {
        "xPct": 39.3,
        "yPct": 101.5
      },
      {
        "xPct": 37.6,
        "yPct": 100.3
      },
      {
        "xPct": 31.5,
        "yPct": 99.8
      },
      {
        "xPct": 30.4,
        "yPct": 98.4
      },
      {
        "xPct": 30.3,
        "yPct": 90.2
      },
      {
        "xPct": 32.5,
        "yPct": 86.7
      },
      {
        "xPct": 32.2,
        "yPct": 75.7
      },
      {
        "xPct": 32.7,
        "yPct": 67.0
      },
      {
        "xPct": 33.7,
        "yPct": 65.9
      },
      {
        "xPct": 40.6,
        "yPct": 61.9
      },
      {
        "xPct": 42.7,
        "yPct": 59.6
      },
      {
        "xPct": 44.6,
        "yPct": 53.9
      },
      {
        "xPct": 44.7,
        "yPct": 46.8
      },
      {
        "xPct": 46.2,
        "yPct": 44.8
      },
      {
        "xPct": 49.1,
        "yPct": 44.3
      },
      {
        "xPct": 57.5,
        "yPct": 44.3
      },
      {
        "xPct": 60.0,
        "yPct": 44.0
      },
      {
        "xPct": 61.2,
        "yPct": 43.3
      },
      {
        "xPct": 61.6,
        "yPct": 42.5
      },
      {
        "xPct": 61.4,
        "yPct": 37.9
      },
      {
        "xPct": 64.2,
        "yPct": 34.4
      },
      {
        "xPct": 67.2,
        "yPct": 32.1
      },
      {
        "xPct": 89.9,
        "yPct": -0.8
      },
      {
        "xPct": 108.0,
        "yPct": -8.0
      }
    ],
    "stations": [
      {
        "id": "021R_churchill",
        "name": "Churchill",
        "xPct": 60.9,
        "yPct": 40.9,
        "glow": 0
      },
      {
        "id": "021R_university",
        "name": "University",
        "xPct": 35.8,
        "yPct": 64.3,
        "glow": 0
      },
      {
        "id": "021R_grandin",
        "name": "Government Centre",
        "xPct": 43.3,
        "yPct": 50.6,
        "glow": 0
      },
      {
        "id": "021R_jasper",
        "name": "Corona / Jasper",
        "xPct": 47.2,
        "yPct": 44.2,
        "glow": 0
      }
    ],
    "trains": [
      {
        "progress": 0.15,
        "speed": 0.0024,
        "length": 0.16,
        "active": true,
        "cooldown": 0,
        "maxCooldown": 240
      }
    ]
  },
  {
    "id": "022R",
    "name": "Metro Line LRT",
    "color": "#ef4444",
    "strokeWidth": 8,
    "speed": 0.003,
    "trainLength": 0.15,
    "path": [
      {
        "xPct": 32.1,
        "yPct": 108.0
      },
      {
        "xPct": 32.3,
        "yPct": 74.0
      },
      {
        "xPct": 32.4,
        "yPct": 67.9
      },
      {
        "xPct": 33.0,
        "yPct": 66.5
      },
      {
        "xPct": 40.6,
        "yPct": 61.9
      },
      {
        "xPct": 42.7,
        "yPct": 59.6
      },
      {
        "xPct": 44.6,
        "yPct": 53.9
      },
      {
        "xPct": 44.7,
        "yPct": 46.8
      },
      {
        "xPct": 45.9,
        "yPct": 45.1
      },
      {
        "xPct": 46.9,
        "yPct": 44.4
      },
      {
        "xPct": 59.4,
        "yPct": 44.1
      },
      {
        "xPct": 60.8,
        "yPct": 43.7
      },
      {
        "xPct": 61.6,
        "yPct": 42.5
      },
      {
        "xPct": 61.1,
        "yPct": 37.5
      },
      {
        "xPct": 60.2,
        "yPct": 35.9
      },
      {
        "xPct": 52.7,
        "yPct": 35.3
      },
      {
        "xPct": 52.0,
        "yPct": 34.7
      },
      {
        "xPct": 51.9,
        "yPct": 29.4
      },
      {
        "xPct": 53.4,
        "yPct": 27.3
      },
      {
        "xPct": 53.4,
        "yPct": 24.3
      },
      {
        "xPct": 50.6,
        "yPct": 20.9
      },
      {
        "xPct": 50.3,
        "yPct": 12.6
      },
      {
        "xPct": 49.6,
        "yPct": 11.8
      },
      {
        "xPct": 46.8,
        "yPct": 11.6
      },
      {
        "xPct": 45.2,
        "yPct": 10.0
      },
      {
        "xPct": 42.8,
        "yPct": -8.0
      }
    ],
    "stations": [
      {
        "id": "022R_churchill",
        "name": "Churchill",
        "xPct": 60.9,
        "yPct": 40.9,
        "glow": 0
      },
      {
        "id": "022R_university",
        "name": "University",
        "xPct": 35.8,
        "yPct": 64.3,
        "glow": 0
      },
      {
        "id": "022R_macewan",
        "name": "MacEwan",
        "xPct": 53.5,
        "yPct": 35.7,
        "glow": 0
      },
      {
        "id": "022R_grandin",
        "name": "Government Centre",
        "xPct": 43.3,
        "yPct": 50.6,
        "glow": 0
      },
      {
        "id": "022R_jasper",
        "name": "Corona / Jasper",
        "xPct": 47.2,
        "yPct": 44.2,
        "glow": 0
      }
    ],
    "trains": [
      {
        "progress": -0.4,
        "speed": 0.0026,
        "length": 0.15,
        "active": false,
        "cooldown": 120,
        "maxCooldown": 260
      }
    ]
  },
  {
    "id": "023R",
    "name": "Valley Line LRT",
    "color": "#06b6d4",
    "strokeWidth": 8,
    "speed": 0.0032,
    "trainLength": 0.16,
    "path": [
      {
        "xPct": 108.0,
        "yPct": 108.0
      },
      {
        "xPct": 98.0,
        "yPct": 99.3
      },
      {
        "xPct": 95.2,
        "yPct": 95.6
      },
      {
        "xPct": 92.0,
        "yPct": 95.4
      },
      {
        "xPct": 88.2,
        "yPct": 90.9
      },
      {
        "xPct": 88.0,
        "yPct": 67.9
      },
      {
        "xPct": 86.3,
        "yPct": 63.9
      },
      {
        "xPct": 86.3,
        "yPct": 56.4
      },
      {
        "xPct": 75.5,
        "yPct": 56.2
      },
      {
        "xPct": 72.9,
        "yPct": 54.7
      },
      {
        "xPct": 68.7,
        "yPct": 54.4
      },
      {
        "xPct": 67.7,
        "yPct": 53.8
      },
      {
        "xPct": 67.9,
        "yPct": 50.9
      },
      {
        "xPct": 70.3,
        "yPct": 48.8
      },
      {
        "xPct": 70.8,
        "yPct": 47.4
      },
      {
        "xPct": 70.8,
        "yPct": 42.9
      },
      {
        "xPct": 69.4,
        "yPct": 39.0
      },
      {
        "xPct": 65.7,
        "yPct": 39.5
      },
      {
        "xPct": 61.7,
        "yPct": 40.9
      },
      {
        "xPct": 56.3,
        "yPct": 41.4
      },
      {
        "xPct": 45.0,
        "yPct": 41.4
      },
      {
        "xPct": -8.0,
        "yPct": 41.4
      }
    ],
    "stations": [
      {
        "id": "023R_churchill",
        "name": "Churchill",
        "xPct": 60.9,
        "yPct": 40.9,
        "glow": 0
      },
      {
        "id": "023R_davies",
        "name": "Davies",
        "xPct": 87.4,
        "yPct": 92.2,
        "glow": 0
      },
      {
        "id": "023R_jasper",
        "name": "Corona / Jasper",
        "xPct": 47.2,
        "yPct": 44.2,
        "glow": 0
      }
    ],
    "trains": [
      {
        "progress": 0.65,
        "speed": 0.0027,
        "length": 0.16,
        "active": true,
        "cooldown": 0,
        "maxCooldown": 220
      }
    ]
  },
  {
    "id": "001",
    "name": "Route 1 Downtown-Capilano",
    "color": "#3b82f6",
    "strokeWidth": 7,
    "speed": 0.0026,
    "trainLength": 0.14,
    "path": [
      {
        "xPct": -8.0,
        "yPct": 46.0
      },
      {
        "xPct": 40.0,
        "yPct": 46.0
      },
      {
        "xPct": 56.4,
        "yPct": 46.0
      },
      {
        "xPct": 56.2,
        "yPct": 44.3
      },
      {
        "xPct": 57.7,
        "yPct": 44.3
      },
      {
        "xPct": 57.7,
        "yPct": 37.5
      },
      {
        "xPct": 62.0,
        "yPct": 37.1
      },
      {
        "xPct": 68.3,
        "yPct": 35.2
      },
      {
        "xPct": 70.0,
        "yPct": 40.5
      },
      {
        "xPct": 70.4,
        "yPct": 40.5
      },
      {
        "xPct": 71.9,
        "yPct": 40.2
      },
      {
        "xPct": 74.1,
        "yPct": 35.8
      },
      {
        "xPct": 84.2,
        "yPct": 32.4
      },
      {
        "xPct": 86.4,
        "yPct": 33.3
      },
      {
        "xPct": 107.5,
        "yPct": 33.4
      },
      {
        "xPct": 108.0,
        "yPct": 32.8
      }
    ],
    "stations": [
      {
        "id": "001_churchill",
        "name": "Churchill",
        "xPct": 60.9,
        "yPct": 40.9,
        "glow": 0
      }
    ],
    "trains": [
      {
        "progress": -0.2,
        "speed": 0.0025,
        "length": 0.14,
        "active": false,
        "cooldown": 60,
        "maxCooldown": 280
      }
    ]
  },
  {
    "id": "004",
    "name": "Route 4 University-Capilano",
    "color": "#f97316",
    "strokeWidth": 7,
    "speed": 0.0029,
    "trainLength": 0.14,
    "path": [
      {
        "xPct": -8.0,
        "yPct": 65.4
      },
      {
        "xPct": 15.0,
        "yPct": 65.4
      },
      {
        "xPct": 32.6,
        "yPct": 65.4
      },
      {
        "xPct": 36.3,
        "yPct": 65.3
      },
      {
        "xPct": 36.5,
        "yPct": 74.0
      },
      {
        "xPct": 97.6,
        "yPct": 74.0
      },
      {
        "xPct": 97.8,
        "yPct": 65.3
      },
      {
        "xPct": 98.2,
        "yPct": 64.8
      },
      {
        "xPct": 107.7,
        "yPct": 64.7
      },
      {
        "xPct": 108.0,
        "yPct": 66.4
      }
    ],
    "stations": [
      {
        "id": "004_university",
        "name": "University",
        "xPct": 35.8,
        "yPct": 64.3,
        "glow": 0
      }
    ],
    "trains": [
      {
        "progress": 0.4,
        "speed": 0.0028,
        "length": 0.14,
        "active": true,
        "cooldown": 0,
        "maxCooldown": 250
      }
    ]
  },
  {
    "id": "008",
    "name": "Route 8 Downtown-Whyte",
    "color": "#a855f7",
    "strokeWidth": 7,
    "speed": 0.0027,
    "trainLength": 0.15,
    "path": [
      {
        "xPct": 108.0,
        "yPct": 6.0
      },
      {
        "xPct": 83.5,
        "yPct": 5.7
      },
      {
        "xPct": 85.2,
        "yPct": 5.2
      },
      {
        "xPct": 83.8,
        "yPct": 5.3
      },
      {
        "xPct": 83.5,
        "yPct": 6.0
      },
      {
        "xPct": 50.5,
        "yPct": 6.0
      },
      {
        "xPct": 50.0,
        "yPct": 11.3
      },
      {
        "xPct": 46.1,
        "yPct": 14.1
      },
      {
        "xPct": 46.1,
        "yPct": 43.9
      },
      {
        "xPct": 60.4,
        "yPct": 44.0
      },
      {
        "xPct": 60.6,
        "yPct": 46.0
      },
      {
        "xPct": 59.6,
        "yPct": 46.9
      },
      {
        "xPct": 57.9,
        "yPct": 47.1
      },
      {
        "xPct": 58.1,
        "yPct": 48.4
      },
      {
        "xPct": 59.0,
        "yPct": 48.7
      },
      {
        "xPct": 61.4,
        "yPct": 47.3
      },
      {
        "xPct": 64.8,
        "yPct": 49.2
      },
      {
        "xPct": 65.4,
        "yPct": 52.7
      },
      {
        "xPct": 64.0,
        "yPct": 55.2
      },
      {
        "xPct": 64.4,
        "yPct": 59.9
      },
      {
        "xPct": 63.7,
        "yPct": 62.1
      },
      {
        "xPct": 63.7,
        "yPct": 73.5
      },
      {
        "xPct": 63.0,
        "yPct": 73.9
      },
      {
        "xPct": 36.6,
        "yPct": 73.8
      },
      {
        "xPct": 36.3,
        "yPct": 68.2
      },
      {
        "xPct": 35.7,
        "yPct": 67.7
      },
      {
        "xPct": 32.6,
        "yPct": 67.7
      },
      {
        "xPct": 32.5,
        "yPct": 66.0
      },
      {
        "xPct": 32.6,
        "yPct": 65.2
      },
      {
        "xPct": 36.1,
        "yPct": 65.2
      },
      {
        "xPct": 20.0,
        "yPct": 75.0
      },
      {
        "xPct": -8.0,
        "yPct": 85.0
      }
    ],
    "stations": [
      {
        "id": "008_churchill",
        "name": "Churchill",
        "xPct": 60.9,
        "yPct": 40.9,
        "glow": 0
      },
      {
        "id": "008_university",
        "name": "University",
        "xPct": 35.8,
        "yPct": 64.3,
        "glow": 0
      },
      {
        "id": "008_jasper",
        "name": "Corona / Jasper",
        "xPct": 47.2,
        "yPct": 44.2,
        "glow": 0
      }
    ],
    "trains": [
      {
        "progress": -0.6,
        "speed": 0.0024,
        "length": 0.15,
        "active": false,
        "cooldown": 180,
        "maxCooldown": 270
      }
    ]
  },
  {
    "id": "002",
    "name": "Route 2 Westmount-Stadium",
    "color": "#eab308",
    "strokeWidth": 7,
    "speed": 0.0031,
    "trainLength": 0.15,
    "path": [
      {
        "xPct": -8.0,
        "yPct": 72.2
      },
      {
        "xPct": 1.4,
        "yPct": 72.4
      },
      {
        "xPct": 1.0,
        "yPct": 71.3
      },
      {
        "xPct": 1.0,
        "yPct": 31.9
      },
      {
        "xPct": 1.6,
        "yPct": 31.3
      },
      {
        "xPct": 24.5,
        "yPct": 31.4
      },
      {
        "xPct": 24.4,
        "yPct": 43.2
      },
      {
        "xPct": 24.8,
        "yPct": 43.6
      },
      {
        "xPct": 28.1,
        "yPct": 44.2
      },
      {
        "xPct": 43.7,
        "yPct": 44.3
      },
      {
        "xPct": 57.7,
        "yPct": 44.3
      },
      {
        "xPct": 61.8,
        "yPct": 43.8
      },
      {
        "xPct": 65.5,
        "yPct": 41.9
      },
      {
        "xPct": 68.9,
        "yPct": 39.1
      },
      {
        "xPct": 72.0,
        "yPct": 34.8
      },
      {
        "xPct": 74.8,
        "yPct": 26.8
      },
      {
        "xPct": 78.5,
        "yPct": 23.5
      },
      {
        "xPct": 78.5,
        "yPct": 20.4
      },
      {
        "xPct": 76.4,
        "yPct": 19.9
      },
      {
        "xPct": 108.0,
        "yPct": 15.0
      }
    ],
    "stations": [
      {
        "id": "002_churchill",
        "name": "Churchill",
        "xPct": 60.9,
        "yPct": 40.9,
        "glow": 0
      },
      {
        "id": "002_stadium",
        "name": "Stadium",
        "xPct": 76.8,
        "yPct": 18.8,
        "glow": 0
      },
      {
        "id": "002_jasper",
        "name": "Corona / Jasper",
        "xPct": 47.2,
        "yPct": 44.2,
        "glow": 0
      }
    ],
    "trains": [
      {
        "progress": 0.85,
        "speed": 0.0026,
        "length": 0.15,
        "active": true,
        "cooldown": 0,
        "maxCooldown": 240
      }
    ]
  },
  {
    "id": "009",
    "name": "Route 9 Southgate-Downtown",
    "color": "#10b981",
    "strokeWidth": 7,
    "speed": 0.0028,
    "trainLength": 0.15,
    "path": [
      {
        "xPct": 59.0,
        "yPct": -8.0
      },
      {
        "xPct": 58.8,
        "yPct": 5.7
      },
      {
        "xPct": 56.4,
        "yPct": 6.3
      },
      {
        "xPct": 57.7,
        "yPct": 7.4
      },
      {
        "xPct": 57.7,
        "yPct": 46.1
      },
      {
        "xPct": 56.5,
        "yPct": 46.9
      },
      {
        "xPct": 56.2,
        "yPct": 50.1
      },
      {
        "xPct": 53.9,
        "yPct": 53.0
      },
      {
        "xPct": 51.0,
        "yPct": 53.2
      },
      {
        "xPct": 48.0,
        "yPct": 52.6
      },
      {
        "xPct": 45.9,
        "yPct": 53.0
      },
      {
        "xPct": 42.6,
        "yPct": 62.5
      },
      {
        "xPct": 42.5,
        "yPct": 64.4
      },
      {
        "xPct": 43.3,
        "yPct": 65.8
      },
      {
        "xPct": 43.4,
        "yPct": 105.1
      },
      {
        "xPct": 39.4,
        "yPct": 105.1
      },
      {
        "xPct": 39.3,
        "yPct": 114.5
      },
      {
        "xPct": 40.1,
        "yPct": 114.8
      },
      {
        "xPct": 40.1,
        "yPct": 117.2
      },
      {
        "xPct": 39.7,
        "yPct": 117.5
      },
      {
        "xPct": 39.7,
        "yPct": 108.0
      }
    ],
    "stations": [
      {
        "id": "009_grandin",
        "name": "Government Centre",
        "xPct": 43.3,
        "yPct": 50.6,
        "glow": 0
      }
    ],
    "trains": [
      {
        "progress": -0.8,
        "speed": 0.0025,
        "length": 0.15,
        "active": false,
        "cooldown": 220,
        "maxCooldown": 260
      }
    ]
  }
];

export const EDMONTON_INTERCHANGES = [
  { id: 'int_churchill', name: 'Churchill', xPct: 60.9, yPct: 40.9, glow: 0 },
  { id: 'int_university', name: 'University', xPct: 35.8, yPct: 64.3, glow: 0 },
  { id: 'int_whyte', name: 'Whyte Ave', xPct: 53.5, yPct: 73.8, glow: 0 },
  { id: 'int_government', name: 'Government Centre', xPct: 43.3, yPct: 50.6, glow: 0 },
  { id: 'int_macewan', name: 'MacEwan', xPct: 53.5, yPct: 35.7, glow: 0 },
  { id: 'int_stadium', name: 'Stadium', xPct: 76.8, yPct: 18.8, glow: 0 },
  { id: 'int_davies', name: 'Davies', xPct: 87.4, yPct: 92.2, glow: 0 },
];
