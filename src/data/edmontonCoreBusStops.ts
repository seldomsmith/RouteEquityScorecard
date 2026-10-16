// Core Edmonton bus stops dataset bounded by 118 Ave (N), 63 Ave (S), 142 St (W), 75 St (E)
export interface CoreBusStop {
  id: string;
  name: string;
  grade: 'A' | 'B' | 'C' | 'D' | 'E';
  score: number;
  trips: number;
  routes: string[];
  xPct: number;
  yPct: number;
}

export interface CoreArterialCorridor {
  name: string;
  path: { xPct: number; yPct: number }[];
}

export const EDMONTON_CORE_BUS_STOPS: CoreBusStop[] = [
  {
    "id": "1015",
    "name": "Wayne Gretzky Drive S & 118 Avenue",
    "grade": "A",
    "score": 75.9,
    "trips": 227,
    "routes": [
      "008",
      "053",
      "102",
      "104",
      "633"
    ],
    "xPct": 88.59,
    "yPct": 5.89
  },
  {
    "id": "1023",
    "name": "96 Street & 111 Avenue",
    "grade": "A",
    "score": 87.4,
    "trips": 77,
    "routes": [
      "003"
    ],
    "xPct": 60.27,
    "yPct": 20.5
  },
  {
    "id": "1026",
    "name": "Alex Taylor Road & Jasper Avenue",
    "grade": "A",
    "score": 78.6,
    "trips": 87,
    "routes": [
      "002"
    ],
    "xPct": 71.39,
    "yPct": 35.85
  },
  {
    "id": "1033",
    "name": "68 Street & 118 Avenue",
    "grade": "A",
    "score": 77.6,
    "trips": 174,
    "routes": [
      "008",
      "102",
      "104",
      "627"
    ],
    "xPct": 95.32,
    "yPct": 6.07
  },
  {
    "id": "1040",
    "name": "97 Street & 118 Avenue",
    "grade": "A",
    "score": 86.2,
    "trips": 170,
    "routes": [
      "009",
      "103"
    ],
    "xPct": 59.05,
    "yPct": 5.38
  },
  {
    "id": "1048",
    "name": "97 Street & 120 Avenue",
    "grade": "A",
    "score": 86.9,
    "trips": 174,
    "routes": [
      "009",
      "103"
    ],
    "xPct": 58.68,
    "yPct": 2.46
  },
  {
    "id": "1056",
    "name": "95 Street & 115 Avenue",
    "grade": "A",
    "score": 85.2,
    "trips": 77,
    "routes": [
      "005"
    ],
    "xPct": 62.94,
    "yPct": 11.48
  },
  {
    "id": "1066",
    "name": "Groat Road & 118 Avenue",
    "grade": "A",
    "score": 74.8,
    "trips": 104,
    "routes": [
      "051",
      "903"
    ],
    "xPct": 15.42,
    "yPct": 6.01
  },
  {
    "id": "1077",
    "name": "121 Street & Jasper Avenue",
    "grade": "D",
    "score": 57.5,
    "trips": 209,
    "routes": [
      "002",
      "005"
    ],
    "xPct": 29.0,
    "yPct": 44.36
  },
  {
    "id": "1080",
    "name": "88 Street & 112 Avenue",
    "grade": "A",
    "score": 90.1,
    "trips": 78,
    "routes": [
      "003"
    ],
    "xPct": 71.41,
    "yPct": 18.24
  },
  {
    "id": "1083",
    "name": "109 Street & Jasper Avenue",
    "grade": "D",
    "score": 55.3,
    "trips": 354,
    "routes": [
      "002",
      "005",
      "008",
      "208",
      "413",
      "900X"
    ],
    "xPct": 47.12,
    "yPct": 44.38
  },
  {
    "id": "1093",
    "name": "103 Street & 118 Avenue",
    "grade": "A",
    "score": 80.1,
    "trips": 84,
    "routes": [
      "008"
    ],
    "xPct": 54.32,
    "yPct": 5.95
  },
  {
    "id": "1106",
    "name": "Kingsway RAH Transit Centre",
    "grade": "A",
    "score": 75.5,
    "trips": 204,
    "routes": [
      "103",
      "903"
    ],
    "xPct": 51.62,
    "yPct": 21.88
  },
  {
    "id": "11095",
    "name": "109 Street & 103 Avenue",
    "grade": "D",
    "score": 57.9,
    "trips": 224,
    "routes": [
      "008",
      "201",
      "208",
      "560",
      "110X"
    ],
    "xPct": 46.25,
    "yPct": 38.97
  },
  {
    "id": "1120",
    "name": "99 Street & Jasper Avenue",
    "grade": "D",
    "score": 57.3,
    "trips": 247,
    "routes": [
      "002",
      "005",
      "111",
      "211",
      "130X",
      "150X"
    ],
    "xPct": 62.94,
    "yPct": 43.23
  },
  {
    "id": "1126",
    "name": "97 Street & 120 Avenue",
    "grade": "A",
    "score": 86.3,
    "trips": 170,
    "routes": [
      "009",
      "103"
    ],
    "xPct": 59.0,
    "yPct": 1.4
  },
  {
    "id": "1130",
    "name": "95 Street & 111 Avenue",
    "grade": "A",
    "score": 89.5,
    "trips": 77,
    "routes": [
      "003"
    ],
    "xPct": 62.45,
    "yPct": 19.6
  },
  {
    "id": "11319",
    "name": "95 Street & 103A Avenue",
    "grade": "A",
    "score": 86.9,
    "trips": 81,
    "routes": [
      "001"
    ],
    "xPct": 67.71,
    "yPct": 35.28
  },
  {
    "id": "11334",
    "name": "102 Street & 104 Avenue",
    "grade": "C",
    "score": 62.6,
    "trips": 153,
    "routes": [
      "007",
      "500X"
    ],
    "xPct": 56.67,
    "yPct": 37.26
  },
  {
    "id": "1136",
    "name": "82 Street & 118 Avenue",
    "grade": "A",
    "score": 94.3,
    "trips": 107,
    "routes": [
      "102",
      "114"
    ],
    "xPct": 78.61,
    "yPct": 5.51
  },
  {
    "id": "1138",
    "name": "95 Street & 117 Avenue",
    "grade": "A",
    "score": 82.2,
    "trips": 77,
    "routes": [
      "005"
    ],
    "xPct": 62.92,
    "yPct": 7.51
  },
  {
    "id": "1142",
    "name": "101 Street & MacDonald Drive",
    "grade": "E",
    "score": 54.1,
    "trips": 124,
    "routes": [
      "009"
    ],
    "xPct": 57.58,
    "yPct": 45.82
  },
  {
    "id": "1154",
    "name": "74 Street & 112 Avenue",
    "grade": "E",
    "score": 49.9,
    "trips": 57,
    "routes": [
      "101",
      "111",
      "622"
    ],
    "xPct": 91.63,
    "yPct": 16.91
  },
  {
    "id": "1163",
    "name": "95 Street & 115 Avenue",
    "grade": "A",
    "score": 85.1,
    "trips": 7,
    "routes": [
      "111"
    ],
    "xPct": 63.33,
    "yPct": 12.04
  },
  {
    "id": "1169",
    "name": "95 Street & 108A Avenue",
    "grade": "A",
    "score": 93.3,
    "trips": 84,
    "routes": [
      "005",
      "111"
    ],
    "xPct": 64.85,
    "yPct": 24.74
  },
  {
    "id": "1181",
    "name": "97 Street & 110 Avenue",
    "grade": "A",
    "score": 87.6,
    "trips": 56,
    "routes": [
      "701"
    ],
    "xPct": 59.35,
    "yPct": 22.79
  },
  {
    "id": "1189",
    "name": "95 Street & 113 Avenue",
    "grade": "A",
    "score": 87.5,
    "trips": 84,
    "routes": [
      "005",
      "111"
    ],
    "xPct": 62.97,
    "yPct": 15.7
  },
  {
    "id": "1196",
    "name": "97 Street & Jasper Avenue",
    "grade": "C",
    "score": 62.1,
    "trips": 215,
    "routes": [
      "002",
      "005",
      "111"
    ],
    "xPct": 64.84,
    "yPct": 42.46
  },
  {
    "id": "1202",
    "name": "Coliseum Transit Centre",
    "grade": "A",
    "score": 82.5,
    "trips": 155,
    "routes": [
      "005"
    ],
    "xPct": 84.77,
    "yPct": 5.52
  },
  {
    "id": "1205",
    "name": "Coliseum Transit Centre",
    "grade": "A",
    "score": 83.8,
    "trips": 6,
    "routes": [
      "589"
    ],
    "xPct": 84.05,
    "yPct": 5.64
  },
  {
    "id": "1208",
    "name": "Coliseum Transit Centre",
    "grade": "A",
    "score": 84.6,
    "trips": 84,
    "routes": [
      "008"
    ],
    "xPct": 84.34,
    "yPct": 5.2
  },
  {
    "id": "1211",
    "name": "Coliseum Transit Centre",
    "grade": "A",
    "score": 83.2,
    "trips": 62,
    "routes": [
      "002",
      "053",
      "633",
      "CapRep"
    ],
    "xPct": 85.4,
    "yPct": 4.99
  },
  {
    "id": "1223",
    "name": "106 Street & 117 Avenue",
    "grade": "C",
    "score": 61.2,
    "trips": 256,
    "routes": [
      "008",
      "102",
      "560",
      "902",
      "110X"
    ],
    "xPct": 50.31,
    "yPct": 9.81
  },
  {
    "id": "1227",
    "name": "106 Street & 117 Avenue",
    "grade": "C",
    "score": 62.6,
    "trips": 260,
    "routes": [
      "008",
      "102",
      "560",
      "902",
      "110X"
    ],
    "xPct": 50.59,
    "yPct": 9.0
  },
  {
    "id": "1235",
    "name": "82 Street & 118 Avenue",
    "grade": "A",
    "score": 94.0,
    "trips": 273,
    "routes": [
      "002",
      "005",
      "008",
      "102",
      "114"
    ],
    "xPct": 79.06,
    "yPct": 6.06
  },
  {
    "id": "1239",
    "name": "86 Street & 114 Avenue",
    "grade": "A",
    "score": 87.2,
    "trips": 7,
    "routes": [
      "111"
    ],
    "xPct": 73.69,
    "yPct": 14.37
  },
  {
    "id": "1243",
    "name": "101 Street & 102  Avenue",
    "grade": "D",
    "score": 55.3,
    "trips": 531,
    "routes": [
      "001",
      "009",
      "111",
      "560",
      "701",
      "901",
      "110X",
      "120X",
      "900X"
    ],
    "xPct": 57.56,
    "yPct": 42.49
  },
  {
    "id": "1248",
    "name": "93 Street & Jasper Avenue",
    "grade": "A",
    "score": 79.9,
    "trips": 88,
    "routes": [
      "002"
    ],
    "xPct": 71.14,
    "yPct": 35.92
  },
  {
    "id": "1252",
    "name": "88 Street & 118 Avenue",
    "grade": "A",
    "score": 84.3,
    "trips": 162,
    "routes": [
      "005",
      "008"
    ],
    "xPct": 71.78,
    "yPct": 5.89
  },
  {
    "id": "1259",
    "name": "82 Street & 120 Avenue",
    "grade": "A",
    "score": 96.0,
    "trips": 107,
    "routes": [
      "102",
      "114"
    ],
    "xPct": 78.4,
    "yPct": 2.22
  },
  {
    "id": "1268",
    "name": "95 Street & 111 Avenue",
    "grade": "A",
    "score": 89.2,
    "trips": 84,
    "routes": [
      "005",
      "111"
    ],
    "xPct": 62.98,
    "yPct": 18.66
  },
  {
    "id": "1277",
    "name": "86 Street & 114 Avenue",
    "grade": "A",
    "score": 86.8,
    "trips": 7,
    "routes": [
      "111"
    ],
    "xPct": 73.88,
    "yPct": 13.61
  },
  {
    "id": "1285",
    "name": "66 Street & 118 Avenue",
    "grade": "B",
    "score": 74.4,
    "trips": 174,
    "routes": [
      "008",
      "102",
      "104",
      "627"
    ],
    "xPct": 98.01,
    "yPct": 6.1
  },
  {
    "id": "1288",
    "name": "95 Street & 118 Avenue",
    "grade": "A",
    "score": 83.4,
    "trips": 84,
    "routes": [
      "008"
    ],
    "xPct": 62.29,
    "yPct": 5.91
  },
  {
    "id": "1294",
    "name": "Wayne Gretzky Drive S & 118 Avenue",
    "grade": "A",
    "score": 74.7,
    "trips": 173,
    "routes": [
      "008",
      "102",
      "104"
    ],
    "xPct": 89.69,
    "yPct": 6.2
  },
  {
    "id": "1321",
    "name": "100 Street & 102 Avenue",
    "grade": "D",
    "score": 56.2,
    "trips": 173,
    "routes": [
      "401",
      "411",
      "523",
      "500X"
    ],
    "xPct": 60.22,
    "yPct": 41.33
  },
  {
    "id": "1325",
    "name": "87 Street & 118 Avenue",
    "grade": "A",
    "score": 86.6,
    "trips": 161,
    "routes": [
      "005",
      "008"
    ],
    "xPct": 72.89,
    "yPct": 6.05
  },
  {
    "id": "1331",
    "name": "86 Street & 112 Avenue",
    "grade": "A",
    "score": 89.1,
    "trips": 7,
    "routes": [
      "111"
    ],
    "xPct": 73.88,
    "yPct": 17.52
  },
  {
    "id": "1336",
    "name": "101 Street & Jasper Avenue",
    "grade": "D",
    "score": 54.9,
    "trips": 413,
    "routes": [
      "002",
      "005",
      "008",
      "111",
      "130X",
      "150X",
      "900X"
    ],
    "xPct": 58.83,
    "yPct": 44.25
  },
  {
    "id": "1346",
    "name": "101 Street & 101A Avenue",
    "grade": "D",
    "score": 55.2,
    "trips": 456,
    "routes": [
      "001",
      "009",
      "111",
      "211",
      "701",
      "901",
      "110X",
      "120X"
    ],
    "xPct": 57.83,
    "yPct": 43.06
  },
  {
    "id": "1353",
    "name": "91 Street & 115 Avenue",
    "grade": "A",
    "score": 80.6,
    "trips": 7,
    "routes": [
      "111"
    ],
    "xPct": 67.96,
    "yPct": 12.01
  },
  {
    "id": "1360",
    "name": "101 Street & 107 Avenue",
    "grade": "A",
    "score": 82.2,
    "trips": 207,
    "routes": [
      "009",
      "111",
      "901"
    ],
    "xPct": 57.6,
    "yPct": 31.27
  },
  {
    "id": "1369",
    "name": "101 Street & 114 Avenue",
    "grade": "A",
    "score": 80.9,
    "trips": 174,
    "routes": [
      "009",
      "103"
    ],
    "xPct": 57.63,
    "yPct": 14.25
  },
  {
    "id": "1377",
    "name": "102 Street & 111 Avenue",
    "grade": "A",
    "score": 80.2,
    "trips": 141,
    "routes": [
      "003",
      "111",
      "701"
    ],
    "xPct": 56.89,
    "yPct": 21.07
  },
  {
    "id": "1385",
    "name": "95 Street & 101A Avenue",
    "grade": "A",
    "score": 78.3,
    "trips": 81,
    "routes": [
      "001"
    ],
    "xPct": 69.76,
    "yPct": 39.27
  },
  {
    "id": "1392",
    "name": "119 Street & Jasper Avenue",
    "grade": "D",
    "score": 58.8,
    "trips": 209,
    "routes": [
      "002",
      "005"
    ],
    "xPct": 32.18,
    "yPct": 44.36
  },
  {
    "id": "1397",
    "name": "90 Street & 115 Avenue",
    "grade": "A",
    "score": 80.4,
    "trips": 7,
    "routes": [
      "111"
    ],
    "xPct": 68.41,
    "yPct": 11.88
  },
  {
    "id": "1403",
    "name": "Stadium Transit Centre",
    "grade": "A",
    "score": 88.3,
    "trips": 33,
    "routes": [
      "111",
      "622"
    ],
    "xPct": 74.91,
    "yPct": 20.32
  },
  {
    "id": "1421",
    "name": "97 Street & 105 Avenue",
    "grade": "A",
    "score": 75.0,
    "trips": 63,
    "routes": [
      "111",
      "701"
    ],
    "xPct": 61.96,
    "yPct": 33.87
  },
  {
    "id": "1428",
    "name": "95 Street & 111 Avenue",
    "grade": "A",
    "score": 90.5,
    "trips": 85,
    "routes": [
      "005",
      "111"
    ],
    "xPct": 63.11,
    "yPct": 20.09
  },
  {
    "id": "1437",
    "name": "105 Street & 120 Avenue",
    "grade": "A",
    "score": 75.1,
    "trips": 40,
    "routes": [
      "102"
    ],
    "xPct": 51.96,
    "yPct": 1.67
  },
  {
    "id": "1448",
    "name": "95 Street & 115 Avenue",
    "grade": "A",
    "score": 86.1,
    "trips": 85,
    "routes": [
      "005",
      "111"
    ],
    "xPct": 62.77,
    "yPct": 12.46
  },
  {
    "id": "1456",
    "name": "91 Street & Norwood Boulevard",
    "grade": "A",
    "score": 89.6,
    "trips": 77,
    "routes": [
      "003"
    ],
    "xPct": 66.96,
    "yPct": 18.49
  },
  {
    "id": "1461",
    "name": "96 Street & 118 Avenue",
    "grade": "A",
    "score": 85.8,
    "trips": 84,
    "routes": [
      "008"
    ],
    "xPct": 59.93,
    "yPct": 5.91
  },
  {
    "id": "1466",
    "name": "112 Street & Jasper Avenue",
    "grade": "D",
    "score": 56.2,
    "trips": 256,
    "routes": [
      "002",
      "005",
      "900X"
    ],
    "xPct": 42.82,
    "yPct": 44.37
  },
  {
    "id": "1472",
    "name": "87 Street & Jasper Avenue",
    "grade": "A",
    "score": 76.1,
    "trips": 88,
    "routes": [
      "002"
    ],
    "xPct": 74.15,
    "yPct": 28.75
  },
  {
    "id": "1475",
    "name": "76 Street & 112 Avenue",
    "grade": "D",
    "score": 58.0,
    "trips": 57,
    "routes": [
      "101",
      "111",
      "622"
    ],
    "xPct": 86.99,
    "yPct": 18.01
  },
  {
    "id": "1479",
    "name": "97 Street & 103A Avenue",
    "grade": "B",
    "score": 68.6,
    "trips": 123,
    "routes": [
      "111",
      "701",
      "120X",
      "130X",
      "150X"
    ],
    "xPct": 62.69,
    "yPct": 35.99
  },
  {
    "id": "1484",
    "name": "101 Street & 112 Avenue",
    "grade": "A",
    "score": 80.6,
    "trips": 170,
    "routes": [
      "009",
      "103"
    ],
    "xPct": 57.77,
    "yPct": 17.83
  },
  {
    "id": "1494",
    "name": "90 Street & 118 Avenue",
    "grade": "A",
    "score": 78.1,
    "trips": 162,
    "routes": [
      "005",
      "008"
    ],
    "xPct": 68.2,
    "yPct": 5.9
  },
  {
    "id": "1529",
    "name": "101 Street & 110 Avenue",
    "grade": "A",
    "score": 83.4,
    "trips": 119,
    "routes": [
      "009"
    ],
    "xPct": 57.81,
    "yPct": 22.69
  },
  {
    "id": "1535",
    "name": "95 Street & 110 Avenue",
    "grade": "A",
    "score": 92.5,
    "trips": 85,
    "routes": [
      "005",
      "111"
    ],
    "xPct": 63.83,
    "yPct": 22.19
  },
  {
    "id": "1539",
    "name": "95 Street & 116 Avenue",
    "grade": "A",
    "score": 83.4,
    "trips": 77,
    "routes": [
      "005"
    ],
    "xPct": 62.93,
    "yPct": 9.62
  },
  {
    "id": "1552",
    "name": "80 Street & 112 Avenue",
    "grade": "B",
    "score": 67.9,
    "trips": 57,
    "routes": [
      "101",
      "111",
      "622"
    ],
    "xPct": 80.31,
    "yPct": 17.77
  },
  {
    "id": "1555",
    "name": "97 Street & 103 Avenue",
    "grade": "C",
    "score": 64.9,
    "trips": 25,
    "routes": [
      "111",
      "130X",
      "150X"
    ],
    "xPct": 62.99,
    "yPct": 37.25
  },
  {
    "id": "1563",
    "name": "95 Street & 106 Avenue",
    "grade": "A",
    "score": 92.5,
    "trips": 77,
    "routes": [
      "005"
    ],
    "xPct": 66.8,
    "yPct": 30.42
  },
  {
    "id": "1568",
    "name": "101 Street & 110 Avenue",
    "grade": "A",
    "score": 83.3,
    "trips": 131,
    "routes": [
      "009",
      "111"
    ],
    "xPct": 57.61,
    "yPct": 23.61
  },
  {
    "id": "1571",
    "name": "97 Street & Angel Way",
    "grade": "C",
    "score": 63.4,
    "trips": 71,
    "routes": [
      "130X",
      "150X",
      "900X"
    ],
    "xPct": 63.86,
    "yPct": 40.79
  },
  {
    "id": "1575",
    "name": "115 Street & Jasper Avenue",
    "grade": "D",
    "score": 57.5,
    "trips": 209,
    "routes": [
      "002",
      "005"
    ],
    "xPct": 37.9,
    "yPct": 44.36
  },
  {
    "id": "1587",
    "name": "101 Street & 105A Avenue",
    "grade": "A",
    "score": 76.2,
    "trips": 202,
    "routes": [
      "009",
      "111",
      "901"
    ],
    "xPct": 57.8,
    "yPct": 33.54
  },
  {
    "id": "1613",
    "name": "St Albert Trail & 114 Avenue",
    "grade": "A",
    "score": 78.5,
    "trips": 129,
    "routes": [
      "005",
      "111"
    ],
    "xPct": 16.63,
    "yPct": 14.68
  },
  {
    "id": "1622",
    "name": "104 Street & Jasper Avenue",
    "grade": "D",
    "score": 54.3,
    "trips": 535,
    "routes": [
      "002",
      "005",
      "008",
      "201",
      "560",
      "701",
      "120X",
      "130X",
      "150X",
      "900X"
    ],
    "xPct": 52.56,
    "yPct": 44.11
  },
  {
    "id": "1631",
    "name": "109 Street & 113 Avenue",
    "grade": "D",
    "score": 55.1,
    "trips": 193,
    "routes": [
      "008",
      "902",
      "110X"
    ],
    "xPct": 45.99,
    "yPct": 16.51
  },
  {
    "id": "1640",
    "name": "124 Street & 104 Avenue",
    "grade": "C",
    "score": 61.8,
    "trips": 211,
    "routes": [
      "002",
      "005"
    ],
    "xPct": 24.6,
    "yPct": 36.91
  },
  {
    "id": "1646",
    "name": "120 Street & Jasper Avenue",
    "grade": "D",
    "score": 57.9,
    "trips": 211,
    "routes": [
      "002",
      "005"
    ],
    "xPct": 29.4,
    "yPct": 44.11
  },
  {
    "id": "1662",
    "name": "109 Street & 107 Avenue",
    "grade": "A",
    "score": 80.6,
    "trips": 76,
    "routes": [
      "901"
    ],
    "xPct": 46.66,
    "yPct": 30.74
  },
  {
    "id": "1671",
    "name": "116 Street & 107 Avenue",
    "grade": "B",
    "score": 69.9,
    "trips": 126,
    "routes": [
      "901",
      "902"
    ],
    "xPct": 36.62,
    "yPct": 30.73
  },
  {
    "id": "1682",
    "name": "120 Street & 107 Avenue",
    "grade": "D",
    "score": 58.0,
    "trips": 176,
    "routes": [
      "007",
      "901"
    ],
    "xPct": 30.35,
    "yPct": 31.23
  },
  {
    "id": "1699",
    "name": "124 Street & 114 Avenue",
    "grade": "A",
    "score": 76.7,
    "trips": 122,
    "routes": [
      "005"
    ],
    "xPct": 24.02,
    "yPct": 14.66
  },
  {
    "id": "1712",
    "name": "108 Street & 107 Avenue",
    "grade": "A",
    "score": 81.4,
    "trips": 76,
    "routes": [
      "901"
    ],
    "xPct": 47.22,
    "yPct": 30.53
  },
  {
    "id": "1719",
    "name": "129 Street & 118 Avenue",
    "grade": "A",
    "score": 76.4,
    "trips": 104,
    "routes": [
      "051",
      "903"
    ],
    "xPct": 17.21,
    "yPct": 6.02
  },
  {
    "id": "1731",
    "name": "119 Street & Kingsway",
    "grade": "D",
    "score": 55.2,
    "trips": 60,
    "routes": [
      "691",
      "903",
      "140X"
    ],
    "xPct": 32.82,
    "yPct": 9.27
  },
  {
    "id": "1745",
    "name": "130 Street & 107 Avenue",
    "grade": "E",
    "score": 43.2,
    "trips": 264,
    "routes": [
      "002",
      "007",
      "901"
    ],
    "xPct": 16.71,
    "yPct": 31.33
  },
  {
    "id": "1761",
    "name": "Groat Road & 116 Avenue",
    "grade": "A",
    "score": 80.2,
    "trips": 139,
    "routes": [
      "051",
      "052",
      "907"
    ],
    "xPct": 13.97,
    "yPct": 10.18
  },
  {
    "id": "1794",
    "name": "107 Street & 99 Avenue",
    "grade": "D",
    "score": 57.8,
    "trips": 129,
    "routes": [
      "208",
      "403",
      "413",
      "701",
      "120X",
      "130X",
      "150X"
    ],
    "xPct": 49.07,
    "yPct": 48.55
  },
  {
    "id": "1804",
    "name": "100 Street & 102A Avenue",
    "grade": "D",
    "score": 55.6,
    "trips": 380,
    "routes": [
      "007",
      "401",
      "411",
      "511",
      "523"
    ],
    "xPct": 58.58,
    "yPct": 39.67
  },
  {
    "id": "1815",
    "name": "128 Street & 107 Avenue",
    "grade": "E",
    "score": 45.7,
    "trips": 264,
    "routes": [
      "002",
      "007",
      "901"
    ],
    "xPct": 19.37,
    "yPct": 31.33
  },
  {
    "id": "1825",
    "name": "116 Street & 106 Avenue",
    "grade": "C",
    "score": 63.5,
    "trips": 147,
    "routes": [
      "007",
      "902"
    ],
    "xPct": 36.04,
    "yPct": 33.21
  },
  {
    "id": "1835",
    "name": "116 Street & 105 Avenue",
    "grade": "C",
    "score": 61.3,
    "trips": 147,
    "routes": [
      "007",
      "902"
    ],
    "xPct": 36.1,
    "yPct": 35.52
  },
  {
    "id": "1840",
    "name": "112 Street & Jasper Avenue",
    "grade": "D",
    "score": 56.4,
    "trips": 211,
    "routes": [
      "002",
      "005"
    ],
    "xPct": 41.24,
    "yPct": 44.11
  },
  {
    "id": "1847",
    "name": "123 Street & 118 Avenue",
    "grade": "B",
    "score": 71.1,
    "trips": 92,
    "routes": [
      "201",
      "903",
      "140X"
    ],
    "xPct": 25.09,
    "yPct": 6.23
  },
  {
    "id": "1857",
    "name": "109 Street & 111 Avenue",
    "grade": "B",
    "score": 73.8,
    "trips": 193,
    "routes": [
      "008",
      "902",
      "110X"
    ],
    "xPct": 45.99,
    "yPct": 21.47
  },
  {
    "id": "1869",
    "name": "122 Street & 107 Avenue",
    "grade": "D",
    "score": 56.3,
    "trips": 173,
    "routes": [
      "007",
      "901"
    ],
    "xPct": 26.9,
    "yPct": 31.11
  },
  {
    "id": "1881",
    "name": "124 Street & 107 Avenue",
    "grade": "D",
    "score": 56.4,
    "trips": 176,
    "routes": [
      "007",
      "901"
    ],
    "xPct": 25.08,
    "yPct": 31.32
  },
  {
    "id": "1890",
    "name": "109 Street & Princess Elizabeth Avenue",
    "grade": "E",
    "score": 53.9,
    "trips": 258,
    "routes": [
      "008",
      "111",
      "202",
      "560",
      "902",
      "110X"
    ],
    "xPct": 48.03,
    "yPct": 12.96
  },
  {
    "id": "1901",
    "name": "132 Street & 114 Avenue",
    "grade": "A",
    "score": 78.0,
    "trips": 129,
    "routes": [
      "005",
      "111"
    ],
    "xPct": 12.9,
    "yPct": 15.2
  },
  {
    "id": "1907",
    "name": "Groat Road & 114 Avenue",
    "grade": "A",
    "score": 77.9,
    "trips": 128,
    "routes": [
      "005",
      "111"
    ],
    "xPct": 12.88,
    "yPct": 15.33
  },
  {
    "id": "1918",
    "name": "115 Street & Jasper Avenue",
    "grade": "D",
    "score": 57.4,
    "trips": 211,
    "routes": [
      "002",
      "005"
    ],
    "xPct": 36.6,
    "yPct": 44.14
  },
  {
    "id": "1941",
    "name": "107 Street & 100 Avenue",
    "grade": "D",
    "score": 57.9,
    "trips": 137,
    "routes": [
      "208",
      "403",
      "413",
      "701",
      "120X",
      "130X",
      "150X"
    ],
    "xPct": 48.91,
    "yPct": 47.74
  },
  {
    "id": "1947",
    "name": "St Albert Trail & 119 Avenue",
    "grade": "B",
    "score": 67.8,
    "trips": 80,
    "routes": [
      "052",
      "201",
      "684"
    ],
    "xPct": 13.26,
    "yPct": 3.65
  },
  {
    "id": "1959",
    "name": "108 Street & Jasper Avenue Nearside",
    "grade": "D",
    "score": 54.5,
    "trips": 425,
    "routes": [
      "002",
      "005",
      "008",
      "201",
      "208",
      "413",
      "560",
      "900X"
    ],
    "xPct": 47.74,
    "yPct": 44.11
  },
  {
    "id": "1974",
    "name": "127 Street & 118 Avenue",
    "grade": "A",
    "score": 75.6,
    "trips": 55,
    "routes": [
      "051",
      "140X"
    ],
    "xPct": 20.44,
    "yPct": 5.53
  },
  {
    "id": "1982",
    "name": "105 Street & 107 Avenue",
    "grade": "A",
    "score": 80.5,
    "trips": 76,
    "routes": [
      "901"
    ],
    "xPct": 52.41,
    "yPct": 30.73
  },
  {
    "id": "1991",
    "name": "107 Street & 97 Avenue",
    "grade": "E",
    "score": 53.7,
    "trips": 50,
    "routes": [
      "403",
      "413",
      "701"
    ],
    "xPct": 49.61,
    "yPct": 52.34
  },
  {
    "id": "1995",
    "name": "112 Street & 107 Avenue",
    "grade": "A",
    "score": 76.3,
    "trips": 125,
    "routes": [
      "901",
      "902"
    ],
    "xPct": 41.36,
    "yPct": 30.53
  },
  {
    "id": "2002",
    "name": "University Transit Centre",
    "grade": "A",
    "score": 81.9,
    "trips": 511,
    "routes": [
      "004",
      "008",
      "051",
      "902"
    ],
    "xPct": 36.07,
    "yPct": 65.26
  },
  {
    "id": "2065",
    "name": "87 Street & 82 Avenue",
    "grade": "C",
    "score": 63.2,
    "trips": 138,
    "routes": [
      "004",
      "525"
    ],
    "xPct": 83.55,
    "yPct": 74.06
  },
  {
    "id": "2096",
    "name": "97 Street & 82 Avenue",
    "grade": "D",
    "score": 56.5,
    "trips": 128,
    "routes": [
      "004",
      "656"
    ],
    "xPct": 69.05,
    "yPct": 74.1
  },
  {
    "id": "2134",
    "name": "Low Level Bridge & 98 Avenue",
    "grade": "E",
    "score": 42.4,
    "trips": 141,
    "routes": [
      "008",
      "511",
      "523"
    ],
    "xPct": 64.94,
    "yPct": 48.83
  },
  {
    "id": "2189",
    "name": "80 Street & Wagner Road",
    "grade": "E",
    "score": 50.0,
    "trips": 138,
    "routes": [
      "006",
      "501",
      "502",
      "503"
    ],
    "xPct": 92.45,
    "yPct": 98.25
  },
  {
    "id": "22160",
    "name": "116 Street & 68 Avenue",
    "grade": "E",
    "score": 38.8,
    "trips": 219,
    "routes": [
      "004",
      "031",
      "703",
      "724",
      "910X",
      "930X"
    ],
    "xPct": 27.81,
    "yPct": 90.87
  },
  {
    "id": "2236",
    "name": "96 Street & 82 Avenue",
    "grade": "E",
    "score": 52.8,
    "trips": 120,
    "routes": [
      "004"
    ],
    "xPct": 71.49,
    "yPct": 73.85
  },
  {
    "id": "2248",
    "name": "96 Street & 71 Avenue",
    "grade": "E",
    "score": 52.0,
    "trips": 63,
    "routes": [
      "501",
      "525",
      "656"
    ],
    "xPct": 71.23,
    "yPct": 87.96
  },
  {
    "id": "2262",
    "name": "79 Street & 105 Avenue",
    "grade": "D",
    "score": 54.4,
    "trips": 44,
    "routes": [
      "001",
      "632",
      "634",
      "636"
    ],
    "xPct": 92.77,
    "yPct": 34.85
  },
  {
    "id": "22720",
    "name": "112 Street & 86 Avenue",
    "grade": "B",
    "score": 70.4,
    "trips": 486,
    "routes": [
      "004",
      "008",
      "031",
      "051",
      "203",
      "204",
      "404",
      "723",
      "920X"
    ],
    "xPct": 36.24,
    "yPct": 68.31
  },
  {
    "id": "2285",
    "name": "99 Street & 82 Avenue",
    "grade": "D",
    "score": 59.0,
    "trips": 128,
    "routes": [
      "004",
      "656"
    ],
    "xPct": 64.49,
    "yPct": 74.1
  },
  {
    "id": "2329",
    "name": "83 Street & 86 Avenue",
    "grade": "B",
    "score": 69.5,
    "trips": 27,
    "routes": [
      "401",
      "403",
      "511",
      "636"
    ],
    "xPct": 88.3,
    "yPct": 68.32
  },
  {
    "id": "2344",
    "name": "96 Street & 76 Avenue",
    "grade": "E",
    "score": 46.5,
    "trips": 63,
    "routes": [
      "501",
      "525",
      "656"
    ],
    "xPct": 71.16,
    "yPct": 81.88
  },
  {
    "id": "2375",
    "name": "81 Street & 106 Avenue",
    "grade": "E",
    "score": 54.1,
    "trips": 85,
    "routes": [
      "001",
      "634",
      "635",
      "636"
    ],
    "xPct": 89.7,
    "yPct": 33.17
  },
  {
    "id": "2410",
    "name": "112 Street & 84 Avenue",
    "grade": "C",
    "score": 61.6,
    "trips": 486,
    "routes": [
      "004",
      "008",
      "031",
      "051",
      "203",
      "204",
      "404",
      "723",
      "920X"
    ],
    "xPct": 36.22,
    "yPct": 71.0
  },
  {
    "id": "2495",
    "name": "79 Street & 103 Avenue",
    "grade": "D",
    "score": 55.8,
    "trips": 44,
    "routes": [
      "001",
      "632",
      "634",
      "636"
    ],
    "xPct": 92.76,
    "yPct": 38.98
  },
  {
    "id": "2526",
    "name": "86 Street & Argyll Road",
    "grade": "E",
    "score": 51.0,
    "trips": 64,
    "routes": [
      "501",
      "502",
      "511",
      "656"
    ],
    "xPct": 86.03,
    "yPct": 97.59
  },
  {
    "id": "2544",
    "name": "79 Street & 101 Avenue",
    "grade": "C",
    "score": 60.3,
    "trips": 44,
    "routes": [
      "001",
      "632",
      "634",
      "636"
    ],
    "xPct": 92.74,
    "yPct": 43.41
  },
  {
    "id": "2590",
    "name": "85 Street & 82 Avenue",
    "grade": "C",
    "score": 64.9,
    "trips": 149,
    "routes": [
      "004",
      "524",
      "525"
    ],
    "xPct": 85.14,
    "yPct": 73.9
  },
  {
    "id": "2625",
    "name": "114 Street & 87 Avenue",
    "grade": "B",
    "score": 71.7,
    "trips": 321,
    "routes": [
      "004",
      "031",
      "404",
      "723",
      "920X"
    ],
    "xPct": 32.73,
    "yPct": 68.37
  },
  {
    "id": "2659",
    "name": "99 Street & 82 Avenue",
    "grade": "D",
    "score": 56.9,
    "trips": 204,
    "routes": [
      "004",
      "008"
    ],
    "xPct": 63.0,
    "yPct": 73.82
  },
  {
    "id": "2679",
    "name": "99 Street & 85 Avenue",
    "grade": "E",
    "score": 52.1,
    "trips": 137,
    "routes": [
      "008",
      "523"
    ],
    "xPct": 63.79,
    "yPct": 69.73
  },
  {
    "id": "2683",
    "name": "106 Street & 82 Avenue",
    "grade": "D",
    "score": 56.2,
    "trips": 204,
    "routes": [
      "004",
      "008"
    ],
    "xPct": 49.64,
    "yPct": 73.78
  },
  {
    "id": "2696",
    "name": "106 Street & 62 Avenue",
    "grade": "C",
    "score": 61.1,
    "trips": 49,
    "routes": [
      "652",
      "656",
      "701"
    ],
    "xPct": 49.34,
    "yPct": 98.52
  },
  {
    "id": "2722",
    "name": "105 Street & 82 Avenue",
    "grade": "D",
    "score": 58.1,
    "trips": 228,
    "routes": [
      "004",
      "008",
      "404"
    ],
    "xPct": 52.97,
    "yPct": 74.04
  },
  {
    "id": "2731",
    "name": "106 Street & 73 Avenue",
    "grade": "C",
    "score": 63.6,
    "trips": 51,
    "routes": [
      "652",
      "656",
      "701"
    ],
    "xPct": 49.33,
    "yPct": 84.83
  },
  {
    "id": "2741",
    "name": "106 Street & 63 Avenue",
    "grade": "C",
    "score": 60.6,
    "trips": 51,
    "routes": [
      "652",
      "656",
      "701"
    ],
    "xPct": 49.35,
    "yPct": 96.74
  },
  {
    "id": "2749",
    "name": "114 Street & 87 Avenue",
    "grade": "B",
    "score": 73.4,
    "trips": 128,
    "routes": [
      "051",
      "203",
      "204",
      "902"
    ],
    "xPct": 31.78,
    "yPct": 67.54
  },
  {
    "id": "2778",
    "name": "106 Street & 71 Avenue",
    "grade": "C",
    "score": 64.5,
    "trips": 51,
    "routes": [
      "652",
      "656",
      "701"
    ],
    "xPct": 49.35,
    "yPct": 87.37
  },
  {
    "id": "2824",
    "name": "99 Street & 83 Avenue",
    "grade": "D",
    "score": 57.6,
    "trips": 137,
    "routes": [
      "008",
      "523"
    ],
    "xPct": 63.77,
    "yPct": 72.78
  },
  {
    "id": "2834",
    "name": "112 Street & 82 Avenue",
    "grade": "C",
    "score": 60.4,
    "trips": 227,
    "routes": [
      "004",
      "008",
      "723"
    ],
    "xPct": 37.13,
    "yPct": 74.03
  },
  {
    "id": "2844",
    "name": "116 Street & 87 Avenue",
    "grade": "B",
    "score": 69.7,
    "trips": 176,
    "routes": [
      "051",
      "203",
      "204",
      "414",
      "902"
    ],
    "xPct": 30.48,
    "yPct": 67.82
  },
  {
    "id": "2848",
    "name": "91 Street & 82 Avenue",
    "grade": "D",
    "score": 57.8,
    "trips": 159,
    "routes": [
      "004",
      "404",
      "525"
    ],
    "xPct": 78.85,
    "yPct": 74.1
  },
  {
    "id": "2853",
    "name": "101 Street & 82 Avenue",
    "grade": "D",
    "score": 55.5,
    "trips": 204,
    "routes": [
      "004",
      "008"
    ],
    "xPct": 59.23,
    "yPct": 73.81
  },
  {
    "id": "2864",
    "name": "102 Street & 82 Avenue",
    "grade": "D",
    "score": 56.0,
    "trips": 207,
    "routes": [
      "004",
      "008"
    ],
    "xPct": 57.95,
    "yPct": 74.11
  },
  {
    "id": "2882",
    "name": "112 Street & 87 Avenue",
    "grade": "B",
    "score": 74.0,
    "trips": 134,
    "routes": [
      "008",
      "902"
    ],
    "xPct": 35.66,
    "yPct": 67.6
  },
  {
    "id": "2891",
    "name": "104 Street & 82 Avenue",
    "grade": "D",
    "score": 57.9,
    "trips": 204,
    "routes": [
      "004",
      "008"
    ],
    "xPct": 54.17,
    "yPct": 73.8
  },
  {
    "id": "2974",
    "name": "104 Street & 73 Avenue",
    "grade": "C",
    "score": 63.7,
    "trips": 21,
    "routes": [
      "652",
      "653",
      "654",
      "655",
      "656",
      "657"
    ],
    "xPct": 54.47,
    "yPct": 86.1
  },
  {
    "id": "2986",
    "name": "120 Street & 87 Avenue",
    "grade": "D",
    "score": 54.4,
    "trips": 96,
    "routes": [
      "051",
      "654",
      "902"
    ],
    "xPct": 22.14,
    "yPct": 67.51
  },
  {
    "id": "5043",
    "name": "142 Street & 95 Avenue",
    "grade": "E",
    "score": 42.9,
    "trips": 132,
    "routes": [
      "002",
      "682",
      "904"
    ],
    "xPct": 1.22,
    "yPct": 55.56
  },
  {
    "id": "5055",
    "name": "142 Street & McQueen Road",
    "grade": "E",
    "score": 52.1,
    "trips": 54,
    "routes": [
      "111",
      "683",
      "684",
      "904"
    ],
    "xPct": 0.82,
    "yPct": 25.31
  },
  {
    "id": "5082",
    "name": "142 Street & 104A Avenue",
    "grade": "E",
    "score": 47.7,
    "trips": 132,
    "routes": [
      "002",
      "682",
      "904"
    ],
    "xPct": 1.1,
    "yPct": 36.31
  },
  {
    "id": "5132",
    "name": "142 Street & 101A Avenue",
    "grade": "E",
    "score": 50.9,
    "trips": 130,
    "routes": [
      "002",
      "682",
      "904"
    ],
    "xPct": 0.9,
    "yPct": 42.66
  },
  {
    "id": "5143",
    "name": "142 Street & 118 Avenue",
    "grade": "E",
    "score": 52.8,
    "trips": 109,
    "routes": [
      "903",
      "906",
      "907"
    ],
    "xPct": 0.1,
    "yPct": 5.87
  },
  {
    "id": "5164",
    "name": "142 Street & 111 Avenue",
    "grade": "C",
    "score": 64.3,
    "trips": 40,
    "routes": [
      "684",
      "905",
      "906",
      "908"
    ],
    "xPct": 1.08,
    "yPct": 19.75
  },
  {
    "id": "5182",
    "name": "142 Street & 95 Avenue",
    "grade": "E",
    "score": 41.3,
    "trips": 130,
    "routes": [
      "002",
      "682",
      "904"
    ],
    "xPct": 1.04,
    "yPct": 57.0
  },
  {
    "id": "5203",
    "name": "Westmount Transit Centre",
    "grade": "A",
    "score": 76.1,
    "trips": 47,
    "routes": [
      "052"
    ],
    "xPct": 8.93,
    "yPct": 17.72
  },
  {
    "id": "5206",
    "name": "Westmount Transit Centre",
    "grade": "B",
    "score": 73.8,
    "trips": 89,
    "routes": [
      "051",
      "111",
      "905"
    ],
    "xPct": 8.96,
    "yPct": 18.56
  },
  {
    "id": "5210",
    "name": "Westmount Transit Centre",
    "grade": "A",
    "score": 76.5,
    "trips": 243,
    "routes": [
      "005"
    ],
    "xPct": 8.87,
    "yPct": 17.56
  },
  {
    "id": "5248",
    "name": "135 Street & 115 Avenue",
    "grade": "A",
    "score": 75.6,
    "trips": 187,
    "routes": [
      "051",
      "052",
      "124",
      "907"
    ],
    "xPct": 9.6,
    "yPct": 13.13
  },
  {
    "id": "5330",
    "name": "139 Street & 118 Avenue",
    "grade": "E",
    "score": 52.1,
    "trips": 97,
    "routes": [
      "684",
      "903",
      "907"
    ],
    "xPct": 4.95,
    "yPct": 6.19
  },
  {
    "id": "5390",
    "name": "140 Street & 111 Avenue",
    "grade": "C",
    "score": 65.7,
    "trips": 137,
    "routes": [
      "052",
      "111",
      "904",
      "905",
      "906",
      "908"
    ],
    "xPct": 3.97,
    "yPct": 21.07
  },
  {
    "id": "5406",
    "name": "142 Street & 107 Avenue",
    "grade": "E",
    "score": 47.4,
    "trips": 132,
    "routes": [
      "002",
      "682",
      "904"
    ],
    "xPct": 1.09,
    "yPct": 32.28
  },
  {
    "id": "5453",
    "name": "142 Street & Stony Plain Road",
    "grade": "E",
    "score": 49.5,
    "trips": 132,
    "routes": [
      "002",
      "682",
      "904"
    ],
    "xPct": 1.13,
    "yPct": 41.05
  },
  {
    "id": "5466",
    "name": "135 Street & 114 Avenue",
    "grade": "A",
    "score": 77.1,
    "trips": 310,
    "routes": [
      "005",
      "051",
      "052",
      "111",
      "124",
      "907"
    ],
    "xPct": 9.14,
    "yPct": 14.97
  },
  {
    "id": "5527",
    "name": "142 Street & 96 Avenue",
    "grade": "E",
    "score": 43.4,
    "trips": 130,
    "routes": [
      "002",
      "682",
      "904"
    ],
    "xPct": 1.03,
    "yPct": 54.11
  },
  {
    "id": "5557",
    "name": "142 Street & 97 Avenue",
    "grade": "E",
    "score": 42.7,
    "trips": 132,
    "routes": [
      "002",
      "682",
      "904"
    ],
    "xPct": 1.23,
    "yPct": 53.18
  },
  {
    "id": "5575",
    "name": "142 Street & 111 Avenue",
    "grade": "C",
    "score": 63.5,
    "trips": 137,
    "routes": [
      "052",
      "111",
      "904",
      "905",
      "906",
      "908"
    ],
    "xPct": 1.89,
    "yPct": 21.08
  },
  {
    "id": "5588",
    "name": "142 Street & 91 Avenue",
    "grade": "E",
    "score": 35.4,
    "trips": 132,
    "routes": [
      "002",
      "682",
      "904"
    ],
    "xPct": 1.09,
    "yPct": 64.71
  },
  {
    "id": "5925",
    "name": "135 Street & 114 Avenue",
    "grade": "A",
    "score": 77.2,
    "trips": 129,
    "routes": [
      "005",
      "111"
    ],
    "xPct": 9.6,
    "yPct": 14.43
  },
  {
    "id": "E152",
    "name": "Stadium Transit Centre",
    "grade": "A",
    "score": 87.3,
    "trips": null,
    "routes": [],
    "xPct": 75.07,
    "yPct": 19.27
  },
  {
    "id": "E167",
    "name": "Coliseum Transit Centre",
    "grade": "A",
    "score": 82.9,
    "trips": null,
    "routes": [],
    "xPct": 85.33,
    "yPct": 5.12
  },
  {
    "id": "E171",
    "name": "118 Street Northside",
    "grade": "A",
    "score": 80.1,
    "trips": null,
    "routes": [],
    "xPct": 85.45,
    "yPct": 5.76
  },
  {
    "id": "E201",
    "name": "Coliseum Transit Centre Elevator",
    "grade": "A",
    "score": 82.4,
    "trips": null,
    "routes": [],
    "xPct": 85.34,
    "yPct": 5.24
  },
  {
    "id": "E214",
    "name": "",
    "grade": "A",
    "score": 81.3,
    "trips": null,
    "routes": [],
    "xPct": 85.67,
    "yPct": 5.37
  }
];

export const EDMONTON_CORE_CORRIDORS: CoreArterialCorridor[] = [
  {
    "name": "Jasper Avenue",
    "path": [
      {
        "xPct": 21.26,
        "yPct": 44.16
      },
      {
        "xPct": 40.94,
        "yPct": 44.16
      },
      {
        "xPct": 60.63,
        "yPct": 43.51
      },
      {
        "xPct": 80.31,
        "yPct": 42.86
      }
    ]
  },
  {
    "name": "Whyte Avenue",
    "path": [
      {
        "xPct": 13.39,
        "yPct": 73.77
      },
      {
        "xPct": 37.01,
        "yPct": 73.77
      },
      {
        "xPct": 64.57,
        "yPct": 73.77
      },
      {
        "xPct": 92.13,
        "yPct": 73.77
      }
    ]
  },
  {
    "name": "109 Street",
    "path": [
      {
        "xPct": 46.46,
        "yPct": 12.99
      },
      {
        "xPct": 46.46,
        "yPct": 38.96
      },
      {
        "xPct": 44.88,
        "yPct": 51.95
      },
      {
        "xPct": 45.67,
        "yPct": 74.03
      },
      {
        "xPct": 46.46,
        "yPct": 97.4
      }
    ]
  },
  {
    "name": "124 Street",
    "path": [
      {
        "xPct": 24.41,
        "yPct": 12.99
      },
      {
        "xPct": 24.41,
        "yPct": 45.45
      }
    ]
  },
  {
    "name": "118 Avenue",
    "path": [
      {
        "xPct": 13.39,
        "yPct": 6.49
      },
      {
        "xPct": 52.76,
        "yPct": 6.49
      },
      {
        "xPct": 92.13,
        "yPct": 6.49
      }
    ]
  },
  {
    "name": "97 Street",
    "path": [
      {
        "xPct": 61.42,
        "yPct": 6.49
      },
      {
        "xPct": 61.42,
        "yPct": 41.56
      }
    ]
  }
];
