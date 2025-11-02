// ** Ayarlar **
const DISCORD_USER_ID = '1252284892457468026'; // Discord ID'nizi buraya yazın
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
    
    // Eğer kullanıcı sesi açarsa, müziği çalmaya zorla
    if (music.volume > 0 && music.paused) {
        music.play().catch(e => console.log("Müzik çalma denemesi başarısız: ", e));
    }
    
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
        music.play().catch(e => console.error("Oynatma hatası:", e));
        musicToggle.classList.remove('paused');
    }
    updateVolumeIcon(music.volume);
});

// Tarayıcı kısıtlaması: Kullanıcının ilk etkileşiminde sesi başlatma
function handleFirstInteraction() {
    document.body.removeEventListener('click', handleFirstInteraction);
    // Sadece play'i deneriz, ses seviyesi 0'da kalır (muted)
    music.play().catch(e => {
        console.log("Müzik otomatik oynatma engellendi.");
    });
}

document.body.addEventListener('click', handleFirstInteraction, { once: true });


// 2. DİSCORD VERİ ÇEKME VE GÜNCELLEME
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
    let activityText = 'Şu anda oynamıyor...'; 
    let statusColor = '#99aab5'; // Varsayılan: Gri (Çevrimdışı)
    let activityDotColor = '#99aab5'; // Varsayılan: Gri (Aktivite yok)

    // Discord Durum Rengini Ayarla
    if (user.discord_status === 'online') {
        statusColor = '#43b581'; // Yeşil
    } else if (user.discord_status === 'idle') {
        statusColor = '#faa61a'; // Sarı
    } else if (user.discord_status === 'dnd') {
        statusColor = '#f04747'; // Kırmızı
    }
    
    // Aktivite Kontrolü: Spotify ve Diğer aktiviteler (Oyun/Stream)
    const spotifyActivity = user.activities.find(act => act.name === 'Spotify' && act.type === 2);
    const mainActivity = user.activities.find(act => act.type === 0 || act.type === 1); 

    if (spotifyActivity) {
        activityText = `Spotify'da ${spotifyActivity.details}`;
        activityDotColor = '#1DB954'; // Spotify Yeşili
    } else if (mainActivity) {
        // Oyun/Stream varsa
        activityDotColor = '#43b581'; // Genel Aktivite Yeşili
        if (mainActivity.details) {
            if (mainActivity.state) {
                 activityText = `${mainActivity.details} (${mainActivity.state})`;
            } else {
                 activityText = mainActivity.details;
            }
        } else if (mainActivity.name) {
            activityText = mainActivity.name;
        } 
    } else {
        // Aktif değilse (Boşta/Çevrimiçi ama bir şey yapmıyorsa)
        activityDotColor = '#99aab5'; // Gri
        
        // **DÜZELTME BURADA**
        // Kullanıcı online olsa bile aktif bir şey yapmıyorsa
        activityText = 'Şu anda bir aktivite yok...';
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
            <span class="activity-dot" style="background-color: ${activityDotColor};"></span>
            Aktivite: <strong>${activityText}</strong>
        </div>
    `;

    cardElement.style.display = 'block';
    cardElement.classList.add('active'); 
}

function showOfflineState() {
     // **DÜZELTME BURADA**
     // showOfflineState fonksiyonunda da parantezli ifadeyi kaldırıyoruz.
     cardElement.innerHTML = `
        <div class="discord-header">
            <img src="avatar_placeholder.png" alt="Çevrimdışı" class="discord-avatar">
            <span class="discord-username">Veri Çekilemiyor</span>
        </div>
        <div class="discord-status">
            Durum: <strong>Çevrimdışı</strong>
        </div>
        <div class="discord-status">
            Aktivite: <span class="activity-dot" style="background-color: #99aab5;"></span> <strong>Kullanıcı aktif değil</strong>
        </div>
    `;
    cardElement.style.display = 'block';
    cardElement.classList.add('active');
}

// Uygulamayı Başlat
document.addEventListener('DOMContentLoaded', fetchDiscordData);
