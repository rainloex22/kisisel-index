/* JavaScript dosyanızın güncellenmiş hali */

document.addEventListener('DOMContentLoaded', () => {
    // ... (Müzik Kontrolleri ve diğer başlangıç kodları aynı kalır) ...
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

    // Sesi açma/kapama fonksiyonu (Aynı kalır)
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
            });
        } else {
            backgroundMusic.pause();
            isMusicManuallyPaused = true;
            updateVolumeIcon(0);
        }
    });

    // Ses seviyesi kontrolü (Aynı kalır)
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
    // --- Müzik Kontrolleri Sonu ---


    // Discord API'den verileri çekme 
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

                // 1. Durum Rengi
                const status = user.discord_status || 'offline';
                let statusColor;
                switch (status) {
                    case 'online': statusColor = '#43B581'; break;
                    case 'idle': statusColor = '#FAA61A'; break;
                    case 'dnd': statusColor = '#F04747'; break;
                    default: statusColor = '#747F8D'; 
                }

                // 2. Aktivite
                let activityText = 'Şu anda bir aktivite yok...';
                let activityDotColor = 'transparent';
                let activityDotVisible = false;
                
                // Aktivite mantığı (Aynı kalır)
                if (user.listening_to_spotify) {
                    activityText = `Dinliyor: <strong>${user.spotify.song}</strong> - ${user.spotify.artist}`;
                    activityDotColor = '#1DB954';
                    activityDotVisible = true;
                } else if (user.activities && user.activities.length > 0) {
                    const activity = user.activities.find(act => act.type === 0 || act.type === 1 || act.type === 4); 
                    
                    if (activity) {
                        activityDotVisible = true;
                        if (activity.type === 0) {
                            activityText = `Oynuyor: <strong>${activity.name}</strong>`;
                            activityDotColor = '#5865f2'; 
                        } else if (activity.type === 1) {
                            activityText = `Yayın yapıyor: <strong>${activity.name}</strong>`;
                            activityDotColor = '#9400D3';
                        } else if (activity.type === 4) {
                             activityText = `Durum: <strong>${activity.state || activity.name || 'Özel Durum'}</strong>`;
                             activityDotColor = '#747F8D';
                        }
                    }
                }

                const avatarUrl = `https://cdn.discordapp.com/avatars/${DISCORD_ID}/${user.discord_user.avatar}.png?size=1024`;
                const tag = user.discord_user.discriminator === '0' ? '' : `#${user.discord_user.discriminator}`;
                // Discord'da global_name yoksa username kullanılır.
                const displayName = user.discord_user.global_name || user.discord_user.username;


                // 3. KARTIN YENİ HTML YAPISI İLE GÜNCELLEMESİ
                discordCard.innerHTML = `
                    <div class="discord-header">
                        <div style="position: relative;">
                            <img src="${avatarUrl}" alt="Avatar" class="discord-avatar">
                            <span class="status-dot" style="background-color: ${statusColor}; position: absolute; bottom: 0; right: 0;"></span>
                        </div>
                        
                        <div class="username-and-tag">
                            <span class="discord-username">${displayName}</span>
                            <span class="discord-tag">${tag}</span>
                        </div>
                    </div>

                    <div class="status-indicator-wrapper">
                        ${activityDotVisible ? `<span class="activity-dot" style="background-color: ${activityDotColor};"></span>` : ''}
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

    // Sayaç ve Interval Kodları (Aynı kalır)
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

    fetchDiscordStatus();
    fetchVisitorCount();
    setInterval(fetchDiscordStatus, 10000); 
});
