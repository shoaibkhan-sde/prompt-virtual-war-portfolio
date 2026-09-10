// src/data/stadiums.js

const DEFAULT_SECTIONS = [
  { id: 'north-stand', name: 'North Stand', type: 'Stand', crowd: 72, wait: 12, dist: 180, trend: false },
  { id: 'south-stand', name: 'South Stand', type: 'Stand', crowd: 15, wait: 2, dist: 310, trend: true },
  { id: 'east-wing',   name: 'East Stand',   type: 'Stand', crowd: 45, wait: 5, dist: 220, trend: false },
  { id: 'west-wing',   name: 'West Stand',   type: 'Stand', crowd: 30, wait: 4, dist: 150, trend: true },
  { id: 'food-court-north', name: 'North Food Hub', type: 'Food', crowd: 45, wait: 6, dist: 120, trend: false },
  { id: 'food-court-south', name: 'South Food Hub', type: 'Food', crowd: 85, wait: 18, dist: 90, trend: false },
  { id: 'vip-lounge',  name: 'VIP Lounge',  type: 'Premium', crowd: 10, wait: 1, dist: 50, trend: false },
  { id: 'parking-a',   name: 'Parking (Zone A)', type: 'Parking', crowd: 50, wait: 10, dist: 600, trend: false },
];

export const STADIUMS = [
  {
    id: "wankhede",
    name: "Wankhede Stadium",
    city: "Mumbai",
    lat: 18.9389,
    lon: 72.8258,
    category: "Stadium",
    tags: ["mumbai", "wankhede", "mi", "mumbai indians", "marine drive", "churchgate"],
    poi: [
      { name: "CSMT Station", lat: 18.9400, lon: 72.8355, type: "transit", color: "#f97316" },
      { name: "Marine Lines", lat: 18.9450, lon: 72.8236, type: "transit", color: "#f97316" }
    ],
    sections: [...DEFAULT_SECTIONS]
  },
  {
    id: "chidambaram",
    name: "M. A. Chidambaram Stadium",
    city: "Chennai",
    lat: 13.0628,
    lon: 80.2794,
    category: "Stadium",
    tags: ["chepauk", "chennai", "csk", "super kings"],
    poi: [
      { name: "Chepauk MRTS", lat: 13.0645, lon: 80.2810, type: "transit", color: "#f97316" }
    ],
    sections: [...DEFAULT_SECTIONS]
  },
  {
    id: "chinnaswamy",
    name: "M. Chinnaswamy Stadium",
    city: "Bengaluru",
    lat: 12.9788,
    lon: 77.5996,
    category: "Stadium",
    tags: ["bangalore", "bengaluru", "rcb", "royal challengers"],
    poi: [
      { name: "Cubbon Park Metro", lat: 12.9810, lon: 77.5966, type: "transit", color: "#8b5cf6" }
    ],
    sections: [...DEFAULT_SECTIONS]
  },
  {
    id: "eden-gardens",
    name: "Eden Gardens",
    city: "Kolkata",
    lat: 22.5646,
    lon: 88.3433,
    category: "Stadium",
    tags: ["kolkata", "kkr", "knight riders"],
    poi: [
      { name: "Esplanade Metro", lat: 22.5645, lon: 88.3510, type: "transit", color: "#f97316" }
    ],
    sections: [...DEFAULT_SECTIONS]
  },
  {
    id: "rajiv-gandhi",
    name: "Rajiv Gandhi International Cricket Stadium",
    city: "Hyderabad",
    lat: 17.4065,
    lon: 78.5510,
    category: "Stadium",
    tags: ["hyderabad", "srh", "sunrisers"],
    poi: [
      { name: "Uppal Metro", lat: 17.4020, lon: 78.5570, type: "transit", color: "#f97316" }
    ],
    sections: [...DEFAULT_SECTIONS]
  },
  {
    id: "arun-jaitley",
    name: "Arun Jaitley Stadium",
    city: "Delhi",
    lat: 28.6378,
    lon: 77.2431,
    category: "Stadium",
    tags: ["delhi", "dc", "capitals", "feroz shah kotla"],
    poi: [
      { name: "Delhi Gate Metro", lat: 28.6390, lon: 77.2415, type: "transit", color: "#f97316" }
    ],
    sections: [...DEFAULT_SECTIONS]
  },
  {
    id: "punjab-pca",
    name: "Punjab Cricket Association IS Bindra Stadium",
    city: "Mohali",
    lat: 30.6974,
    lon: 76.7352,
    category: "Stadium",
    tags: ["punjab", "pbks", "kings", "mohali"],
    poi: [],
    sections: [...DEFAULT_SECTIONS]
  },
  {
    id: "hpca",
    name: "Himachal Pradesh Cricket Association Stadium",
    city: "Dharamshala",
    lat: 32.2185,
    lon: 76.3225,
    category: "Stadium",
    tags: ["dharamshala", "hpca", "punjab alternate"],
    poi: [],
    sections: [...DEFAULT_SECTIONS]
  },
  {
    id: "sawai-mansingh",
    name: "Sawai Mansingh Stadium",
    city: "Jaipur",
    lat: 26.8940,
    lon: 75.8032,
    category: "Stadium",
    tags: ["jaipur", "rr", "rajasthan royals"],
    poi: [],
    sections: [...DEFAULT_SECTIONS]
  },
  {
    id: "ekana",
    name: "BRSABV Ekana Cricket Stadium",
    city: "Lucknow",
    lat: 26.8111,
    lon: 81.0169,
    category: "Stadium",
    tags: ["lucknow", "lsg", "super giants", "ekana"],
    poi: [],
    sections: [...DEFAULT_SECTIONS]
  },
  {
    id: "narendra-modi",
    name: "Narendra Modi Stadium",
    city: "Ahmedabad",
    lat: 23.0914,
    lon: 72.5972,
    category: "Stadium",
    tags: ["ahmedabad", "gt", "gujarat titans", "motera"],
    poi: [
      { name: "Motera Stadium Metro", lat: 23.0890, lon: 72.5990, type: "transit", color: "#f97316" }
    ],
    sections: [...DEFAULT_SECTIONS]
  }
];
