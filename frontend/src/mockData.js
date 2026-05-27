// Mock data for Micro NET ISP Landing Page

export const packages = [
  {
    id: 1,
    name: "Home Basic",
    speed: "Up to 20 Mbps",
    price: "150.000",
    type: "residential",
    features: [
      "Unlimited Quota",
      "Gratis Instalasi",
      "Support 24/7",
      "Cocok untuk Streaming HD",
      "Free Modem Router"
    ],
    popular: false
  },
  {
    id: 2,
    name: "Home Premium",
    speed: "Up to 50 Mbps",
    price: "165.000",
    type: "residential",
    features: [
      "Unlimited Quota",
      "Gratis Instalasi",
      "Priority Support 24/7",
      "Ideal untuk Gaming & 4K Streaming",
      "Free Modem Router Dual band",
      "Anti Lag Technology"
    ],
    popular: true
  },
  {
    id: 3,
    name: "Home Ultra",
    speed: "Up to 70 Mbps",
    price: "220.000",
    type: "residential",
    features: [
      "Unlimited Quota",
      "Gratis Instalasi",
      "Priority Support 24/7",
      "Perfect untuk Keluarga Besar",
      "Free Modem Router Dual band",
      "Anti Lag Technology"
    ],
    popular: false
  },
  {
    id: 4,
    name: "Business Start",
    speed: "Up to 100 Mbps",
    price: "350.000",
    type: "business",
    features: [
      "Unlimited Quota",
      "SLA 97%",
      "Priority Support",
      "Free Installation",
      "Cocok untuk UMKM"
    ],
    popular: false
  },
  {
    id: 5,
    name: "Business Pro",
    speed: "Up to 200 Mbps",
    price: "600.000",
    type: "business",
    features: [
      "Unlimited Quota",
      "SLA 97%",
      "Dedicated Support 24/7",
      "Free Installation",
      "Ideal untuk Kantor & Retail",
      "Backup Connection"
    ],
    popular: true
  },
  {
    id: 6,
    name: "Enterprise",
    speed: "Up to 300 Mbps",
    price: "Custom",
    type: "business",
    features: [
      "Unlimited Quota",
      "SLA 97%",
      "Custom Installation",
      "Untuk Kawasan Industri",
      "Redundant Connection",
      "Network Monitoring"
    ],
    popular: false
  }
];

export const services = [
  {
    id: 1,
    title: "Internet Fiber Optic",
    description: "Koneksi internet super cepat dan stabil menggunakan teknologi fiber optic hingga ke rumah Anda",
    icon: "wifi"
  },
  {
    id: 2,
    title: "CCTV Installation",
    description: "Solusi keamanan lengkap dengan CCTV berkualitas tinggi dan remote monitoring 24/7",
    icon: "video"
  },
  {
    id: 3,
    title: "Internet Kantor",
    description: "Paket khusus untuk kantor dengan static IP, SLA guarantee, dan support prioritas",
    icon: "building2"
  },
  {
    id: 4,
    title: "Paket Bisnis",
    description: "Solusi internet untuk bisnis dengan bandwidth dedicated dan uptime maksimal",
    icon: "briefcase"
  }
];

export const testimonials = [
  {
    id: 1,
    name: "Budi Santoso",
    role: "Pelanggan Rumahan - Gringsing",
    content: "Internet Micro NET sangat stabil, cocok banget buat kerja WFH dan anak-anak sekolah online. Support juga cepat tanggap!",
    rating: 5,
    avatar: "BS"
  },
  {
    id: 2,
    name: "PT. Green Wood Perkasa Energy",
    role: "Kawasan Industri KITB",
    content: "Sejak pakai Micro NET untuk jaringan kantor, produktivitas meningkat drastis. Koneksi stabil dan SLA terjamin.",
    rating: 5,
    avatar: "MJ"
  },
  {
    id: 3,
    name: "Rina Gaming",
    role: "Content Creator & Gamer",
    content: "Ping rendah, no lag saat streaming dan gaming. Paket 50 Mbps lebih dari cukup buat live streaming 1080p!",
    rating: 5,
    avatar: "RG"
  },
  {
    id: 4,
    name: "Warung Kopi Digital",
    role: "UMKM Batang",
    content: "Customer kami puas dengan WiFi yang cepat. Investasi terbaik untuk bisnis kami. Recommended!",
    rating: 5,
    avatar: "WK"
  }
];

export const coverageAreas = [
  "Gringsing",
  "Limpung",
  "Kawasan Industri KITB",
  "Dan area lainnya"
];

export const whyChooseUs = [
  {
    id: 1,
    title: "Kecepatan Terjamin",
    description: "Teknologi fiber optic langsung ke rumah untuk koneksi super cepat hingga 1 Gbps",
    icon: "zap"
  },
  {
    id: 2,
    title: "Stabil & Anti Lag",
    description: "Network monitoring 24/7 dan infrastruktur modern memastikan koneksi selalu stabil",
    icon: "activity"
  },
  {
    id: 3,
    title: "Support 24/7",
    description: "Tim support kami siap membantu Anda kapan saja melalui WhatsApp, phone, dan visit",
    icon: "headphones"
  },
  {
    id: 4,
    title: "Harga Terjangkau",
    description: "Paket internet dengan harga kompetitif dan value terbaik untuk setiap rupiah yang Anda bayar",
    icon: "wallet"
  },
  {
    id: 5,
    title: "Gratis Instalasi",
    description: "Tidak ada biaya instalasi dan pemasangan untuk pelanggan baru area coverage",
    icon: "wrench"
  },
  {
    id: 6,
    title: "Partner Resmi",
    description: "Mitra resmi PT. Global Media Data Prima, provider internet terpercaya di Indonesia",
    icon: "award"
  }
];

export const companyInfo = {
  name: "Micro NET",
  tagline: "Internet Cepat, Stabil, Terpercaya untuk Batang",
  phone: "082136019744",
  whatsapp: "6282136019744",
  email: "micromultimediagrup@gmail.com",
  address: "RT.05 Desa Surodadi Kec. Gringsing, Kabupaten Batang, Jawa Tengah",
  website: "micronet.web.id",
  logoVertical: "https://micronet.web.id/assets/images/Logo_Vertical_White.png",
  logoHorizontal: "https://micronet.web.id/assets/images/Logo_Horizontal_White.png",
  logo: "https://micronet.web.id/assets/images/logo-01092024.png"
};

// Mock speedtest data
export const generateSpeedTestResult = () => {
  return {
    download: (Math.random() * 50 + 50).toFixed(2), // 50-100 Mbps
    upload: (Math.random() * 30 + 20).toFixed(2), // 20-50 Mbps
    ping: (Math.random() * 10 + 5).toFixed(0), // 5-15 ms
    jitter: (Math.random() * 3 + 1).toFixed(1) // 1-4 ms
  };
};