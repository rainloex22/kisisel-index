// ** Ayarlar **
const DISCORD_USER_ID = '1252284892457468026'; // Lütfen bu ID'nin doğru olduğundan emin olun!
const LANYARD_API_URL = `https://api.lanyard.rest/v1/users/${DISCORD_USER_ID}`;
const cardElement = document.getElementById('discord-card');

// 1. MÜZİK KONTROLÜ
const music = document.getElementById('background-music');
const musicToggle = document.getElementById('music-toggle');
const volumeSlider = document.getElementById('volume-slider');
const volumeIcon = document.getElementById('volume-icon');

// Başlangıç ayarları: Ses kapalı (0)
music.volume = 0; 
volumeSlider.value = 0;

// Ses seviyesi değişince müzik sesini ayarla
volumeSlider.addEventListener('input', () => {
    music.volume = volumeSlider.value;
    updateVolumeIcon(music.volume);
    
    // Ses açılırsa "paused" sınıfını kaldır, tam kapanırsa ekle
    if (music.volume > 0) {
        musicToggle.classList.remove('paused');
    } else {
        musicToggle.classList.add('paused');
    }
});

// Ses seviyesine göre emojiyi güncelleyen fonksiyon
function updateVolumeIcon(volume) {
    const vol = parseFloat(volume);
    if (vol === 0) {
        volumeIcon.textContent = '🔇'; // Sessiz
    } else if (vol <= 0.4) {
        volumeIcon.textContent = '🔈'; // Düşük
    } else if (vol <= 0.7) {
        volumeIcon.textContent = '🔉'; // Orta
    } else {
        volumeIcon.textContent = '🔊'; // Yüksek
    }
}


// Mute/Unmute düğmesine basıldığında
musicToggle.addEventListener('click', () => {
    if (music.volume > 0 || !music.paused) {
        // Şu an ses açıksa veya çalıyorsa, kapat
        music.volume = 0;
        volumeSlider.value = 0;
        music.pause(); // Müzik durdurulur
        musicToggle.classList.add('paused');
    } else {
        // Şu an kapalıysa, sesi varsayılan olarak 0.5'e aç ve oynat
        music.volume = 0.5; 
        volumeSlider.value = 0.5;
        music.play();
        musicToggle.classList.remove('paused');
    }
    updateVolumeIcon(music.volume);
});

// Kullanıcının ilk etkileşimini yakalama (Tarayıcı kısıtlamaları için)
function handleFirstInteraction() {
    document.body.removeEventListener('click', handleFirstInteraction);
    
    // Sadece play'i deneriz, ses seviyesi 0'da kalır
    music.play().catch(e => {
        console.error("Müzik çalma engellendi, manuel başlatılması gerekiyor.");
    });
}

document.body.addEventListener('click', handleFirstInteraction, { once: true });


// 2. DİSCORD VERİ ÇEKME VE GÜNCELLEME (GÜVENİLİR VERSİYON)
async function fetchDiscordData() {
    try {
        const response = await fetch(LANYARD_API_URL);
        const data = await response.json();

        if (data.success && data.data) {
            const user = data.data;
            updateDiscordCard(user);
        } else {
            showOfflineState();
        }
    } catch (error) {
        console.error("Lanyard API hatası:", error);
        showOfflineState();
    }
    
    // Her 10 saniyede bir verileri güncelle
    setTimeout(fetchDiscordData, 10000); 
}

function updateDiscordCard(user) {
    // İstenen değişiklik: Varsayılan aktivite metni
    let activityText = 'Şu anda oynamıyor...'; 
    let statusColor = '#99aab5'; // Varsayılan: Gri (Çevrimdışı)

    // Durum rengini ayarla
    if (user.discord_status === 'online') {
        statusColor = '#43b581'; // Yeşil
    } else if (user.discord_status === 'idle') {
        statusColor = '#faa61a'; // Sarı
    } else if (user.discord_status === 'dnd') {
        statusColor = '#f04747'; // Kırmızı (Rahatsız Etmeyin)
    }

    // Aktivite kontrolü: Spotify ve Diğer aktiviteler (Oyun/Stream)
    const spotifyActivity = user.activities.find(act => act.name === 'Spotify' && act.type === 2);
    const mainActivity = user.activities.find(act => act.type === 0 || act.type === 1); // 0=Oynuyor, 1=Streaming

    if (spotifyActivity) {
        activityText = `Spotify'da ${spotifyActivity.details}`;
    } else if (mainActivity) {
        // İstenen değişiklik: Ne oynuyorsa onu yazsın (details, state veya name)
        if (mainActivity.details) {
            if (mainActivity.state) {
                 activityText = `${mainActivity.details} (${mainActivity.state})`;
            } else {
                 activityText = mainActivity.details;
            }
        } else if (mainActivity.name) {
            activityText = mainActivity.name;
        } else {
             // Aktivite var ama detay yoksa, varsayılan metin kalır.
        }
    }
    
    // Discord CDN'den avatar çekme
    let avatarUrl = `https://cdn.discordapp.com/avatars/${user.discord_user.id}/${user.discord_user.avatar}.png?size=256`;
    
    // Kartın HTML içeriğini oluştur
    cardElement.innerHTML = `
        <div class="discord-header">
            <img src="${avatarUrl}" alt="${user.discord_user.username}" class="discord-avatar">
            <div>
                <span class="discord-username">${user.discord_user.global_name || user.discord_user.username}</span>
                <span class="discord-tag">#${user.discord_user.discriminator === '0' ? '' : user.discord_user.discriminator}</span>
            </div>
        </div>
        <div class="status-indicator-wrapper">
            <span class="status-dot" style="background-color: ${statusColor};"></span>
            Durum: <strong>${user.discord_status === 'online' ? 'Çevrimiçi' : user.discord_status === 'idle' ? 'Boşta' : user.discord_status === 'dnd' ? 'Rahatsız Etmeyin' : 'Çevrimdışı'}</strong>
        </div>
        <div class="discord-status">
            Aktivite: <strong>${activityText}</strong>
        </div>
    `;

    cardElement.style.display = 'block';
    cardElement.classList.add('active'); 
}

function showOfflineState() {
     cardElement.innerHTML = `
        <div class="discord-header">
            <img src="avatar_placeholder.png" alt="Çevrimdışı" class="discord-avatar">
            <span class="discord-username">Veri Çekilemiyor</span>
        </div>
        <div class="discord-status">
            Durum: <strong>Çevrimdışı</strong>
        </div>
        <div class="discord-status">
            Aktivite: <strong>Lütfen Discord ID'nizi ve Lanyard servisini kontrol edin.</strong>
        </div>
    `;
    cardElement.style.display = 'block';
    cardElement.classList.add('active');
}

// Uygulamayı Başlat
document.addEventListener('DOMContentLoaded', fetchDiscordData);
