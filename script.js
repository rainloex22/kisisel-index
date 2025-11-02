/* ==================================== */
/* SCRIPT.JS - ANA İŞLEVSELLİK */
/* ==================================== */

document.addEventListener('DOMContentLoaded', () => {
    const discordCard = document.getElementById('discord-card');
    const backgroundMusic = document.getElementById('background-music');
    const musicToggle = document.getElementById('music-toggle');
    const volumeSlider = document.getElementById('volume-slider');
    const volumeIcon = document.getElementById('volume-icon');
    const visitorCountTextElement = document.getElementById('visitor-count-text');

    // Müzik Kontrolleri
    let isMusicManuallyPaused = true; 
    
    backgroundMusic.volume = 0;
    volumeSlider.value = 0;
    
    // İkonu güncelleyen yardımcı fonksiyon
    const updateVolumeIcon = (volume) => {
        if (volume > 0) {
            volumeIcon.textContent = '🔊';
            musicToggle.classList.remove('paused');
        } else {
            volumeIcon.textContent = '🔇';
            musicToggle.classList.add('paused');
        }
    };
    
    updateVolumeIcon(backgroundMusic.volume); 

    // Sesi açma/kapama fonksiyonu
    musicToggle.addEventListener('click', () => {
        if (isMusicManuallyPaused) {
            backgroundMusic.play().then(() => {
                isMusicManuallyPaused = false;
                if (volumeSlider.value == 0) {
                    backgroundMusic.volume = 0.5;
                    volumeSlider.value = 0.5;
                }
                updateVolumeIcon(backgroundMusic.volume);
            }).catch(error => {
                console.error("Oynatma hatası:", error);
                alert("Müzik otomatik olarak başlatılamadı.");
            });
        } else {
            backgroundMusic.pause();
            isMusicManuallyPaused = true;
            updateVolumeIcon(0);
        }
    });

    // Ses seviyesi kontrolü
    volumeSlider.addEventListener('input', (e) => {
        const volume = parseFloat(e.target.value);
        backgroundMusic.volume = volume;

        updateVolumeIcon(volume);

        if (volume > 0) {
             isMusicManuallyPaused = false;
             if (backgroundMusic.paused) {
                 backgroundMusic.play().catch(error => {
                     console.error("Oynatma hatası:", error);
                 });
             }
        } else {
             backgroundMusic.pause();
             isMusicManuallyPaused = true;
        }
    });


    // ====================================
    // DISCORD LANYARD API ENTEGRASYONU
    // ====================================
    const DISCORD_ID = '1252284892457468026'; 
    const LANYARD_API_URL = `https://api.lanyard.rest/v1/users/${DISCORD_ID}`;

    const fetchDiscordStatus = () => {
        discordCard.innerHTML = `<div class="loading"></div>`; 

        fetch(LANYARD_API_URL)
            .then(response => response.json())
            .then(data => {
                const user = data.data;

                if (!user || user.listening_to_spotify === undefined) {
                    throw new Error("Discord verileri alınamadı.");
                }

                // 1. Durum Rengi (Sadece nokta rengi için kullanılır)
                const status = user.discord_status || 'offline';
                let statusColor;
                
                switch (status) {
                    case 'online': 
                        statusColor = '#43B581'; // Yeşil 
                        break; 
                    case 'idle': 
                        statusColor = '#FAA61A';   // Turuncu (Ay)
                        break;
                    case 'dnd': 
                        statusColor = '#F04747';    // Kırmızı (Rahatsız Etme)
                        break;
                    case 'invisible':
                    case 'offline':
                    default: 
                        statusColor = '#747F8D'; // Gri 
                        break;
                }

                // 2. Aktivite Metni
                let activityText = 'Şu anda bir aktivite yok...';
                
                // Spotify'ı kontrol et 
                if (user.listening_to_spotify) {
                    activityText = `Dinliyor: <strong>${user.spotify.song}</strong> - ${user.spotify.artist}`;
                } 
                // Diğer aktiviteler
                else if (user.activities && user.activities.length > 0) {
                    const activity = user.activities.find(act => act.type === 0 || act.type === 1 || act.type === 4); 
                    
                    if (activity) {
                        if (activity.type === 0) {
                            activityText = `Oynuyor: <strong>${activity.name}</strong>`;
                        } else if (activity.type === 1) {
                            activityText = `Yayın yapıyor: <strong>${activity.name}</strong>`;
                        } else if (activity.type === 4) {
                             activityText = `Durum: <strong>${activity.state || activity.name || 'Özel Durum'}</strong>`;
                        }
                    }
                }
                
                
                const avatarUrl = `https://cdn.discordapp.com/avatars/${DISCORD_ID}/${user.discord_user.avatar}.png?size=1024`;
                const tag = user.discord_user.discriminator === '0' ? '' : `#${user.discord_user.discriminator}`;
                const displayName = user.discord_user.global_name || user.discord_user.username;


                // 3. KARTIN HTML YAPISI İLE GÜNCELLEMESİ (Aktivite dotu kaldırıldı)
                discordCard.innerHTML = `
                    <div class="discord-header">
                        <div style="position: relative;">
                            <img src="${avatarUrl}" alt="Avatar" class="discord-avatar">
                            <span class="status-dot" style="background-color: ${statusColor}; position: absolute; bottom: 0; right: 0;">
                            </span>
                        </div>
                        
                        <div class="username-and-tag">
                            <span class="discord-username">${displayName}</span>
                            <span class="discord-tag">${tag}</span>
                        </div>
                    </div>

                    <div class="status-indicator-wrapper">
                        <span class="discord-status">${activityText}</span>
                    </div>
                `;
                discordCard.classList.remove('loading');

            })
            .catch(error => {
                console.error("Discord verileri çekilirken hata oluştu:", error);
                discordCard.innerHTML = `<span style="color: #f04747; display: block; text-align: center; padding: 10px;">Discord verileri yüklenemedi. (API Hatası)</span>`;
                discordCard.classList.remove('loading');
            });
    };

    // ====================================
    // ZİYARETÇİ SAYACI ENTEGRASYONU
    // ====================================
    const COUNT_API_NAMESPACE = 'https://bak1kara.github.io/bakikara/';
    const COUNT_API_KEY = 'bakikara';

    const fetchVisitorCount = () => {
        fetch(`https://api.countapi.xyz/hit/${COUNT_API_NAMESPACE}/${COUNT_API_KEY}`)
            .then(response => response.json())
            .then(data => {
                if (visitorCountTextElement) {
                    visitorCountTextElement.textContent = data.value.toLocaleString('tr-TR');
                }
            })
            .catch(error => {
                console.error("Sayaç verileri çekilirken hata oluştu:", error);
                if (visitorCountTextElement) {
                    visitorCountTextElement.textContent = '???';
                }
            });
    };

    // İlk çalıştırma ve yenileme
    fetchDiscordStatus();
    fetchVisitorCount();
    setInterval(fetchDiscordStatus, 10000); 
});
