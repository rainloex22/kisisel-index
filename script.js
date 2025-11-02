document.addEventListener('DOMContentLoaded', () => {
    const discordCard = document.getElementById('discord-card');
    const backgroundMusic = document.getElementById('background-music');
    const musicToggle = document.getElementById('music-toggle');
    const volumeSlider = document.getElementById('volume-slider');
    const volumeIcon = document.getElementById('volume-icon');
    const visitorCountElement = document.getElementById('visitor-count'); // Yeni: Sayaç elemanı

    // Müzik Kontrolleri
    let isPlaying = false;

    // Başlangıçta sesi kapalı (mute) ve ikon 🔇 olarak ayarla
    backgroundMusic.volume = 0;
    volumeSlider.value = 0;
    musicToggle.classList.add('paused');
    musicToggle.setAttribute('aria-label', 'Sesi Aç');


    // Sesi açma/kapama fonksiyonu
    musicToggle.addEventListener('click', () => {
        if (isPlaying) {
            backgroundMusic.pause();
            isPlaying = false;
            musicToggle.classList.add('paused');
            volumeIcon.textContent = '🔇'; // Kapalı ikon
            musicToggle.setAttribute('aria-label', 'Sesi Aç');
        } else {
            // İlk tıklamada müziği başlat
            backgroundMusic.play().catch(error => {
                console.log("Oynatma hatası:", error);
            });
            isPlaying = true;
            musicToggle.classList.remove('paused');
            
            // Eğer slider 0'da değilse, sesi aç (varsayılan: 0.5)
            if (volumeSlider.value == 0) {
                backgroundMusic.volume = 0.5;
                volumeSlider.value = 0.5;
            }
            // Sesi açtıktan sonra ikonu kontrol et
            volumeIcon.textContent = (backgroundMusic.volume > 0) ? '🔊' : '🔇';
            musicToggle.setAttribute('aria-label', 'Sesi Kapat');
        }
    });

    // Ses seviyesi kontrolü
    volumeSlider.addEventListener('input', (e) => {
        const volume = parseFloat(e.target.value);
        backgroundMusic.volume = volume;

        // Ses seviyesine göre ikon güncelleme
        if (volume === 0) {
            volumeIcon.textContent = '🔇'; // Sessiz
            musicToggle.classList.add('paused');
        } else {
            volumeIcon.textContent = '🔊'; // Sesli
            musicToggle.classList.remove('paused');
        }

        // Eğer slider 0'dan yukarı çekilirse ve müzik duraklatılmışsa, oynatmayı başlat
        if (volume > 0 && !isPlaying) {
             backgroundMusic.play().catch(error => {
                console.log("Oynatma hatası:", error);
            });
            isPlaying = true;
            musicToggle.classList.remove('paused');
        }
    });

    // Discord API'den verileri çekme (Buraya kendi API URL'nizi girin)
    // Örnek: 'https://api.lanyard.rest/v1/users/YOUR_DISCORD_ID'
    const DISCORD_ID = '1252284892457468026';
    const LANYARD_API_URL = `https://api.lanyard.rest/v1/users/${DISCORD_ID}`;

    const fetchDiscordStatus = () => {
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
                    case 'online':
                        statusColor = '#43B581'; // Yeşil
                        break;
                    case 'idle':
                        statusColor = '#FAA61A'; // Turuncu
                        break;
                    case 'dnd':
                        statusColor = '#F04747'; // Kırmızı
                        break;
                    default:
                        statusColor = '#747F8D'; // Gri (çevrimdışı/görünmez)
                }

                // 2. Aktivite
                let activityText;
                let activityDotColor = 'transparent'; // Varsayılan: Yok
                let activityDotVisible = false;

                if (user.activities && user.activities.length > 0) {
                    const activity = user.activities[0];
                    activityDotVisible = true;
                    
                    if (activity.type === 0) { // Playing
                        activityText = `Oynuyor: <strong>${activity.name}</strong>`;
                        activityDotColor = '#1DB954'; // Oyun yeşili
                    } else if (activity.type === 1) { // Streaming
                        activityText = `Yayın yapıyor: <strong>${activity.name}</strong>`;
                        activityDotColor = '#9400D3'; // Twitch moru
                    } else if (activity.type === 2) { // Listening (Spotify)
                        if (user.spotify) {
                            activityText = `Dinliyor: <strong>${user.spotify.song}</strong> - ${user.spotify.artist}`;
                            activityDotColor = '#1DB954'; // Spotify yeşili
                        } else {
                            activityText = 'Şu anda bir aktivite yok...';
                            activityDotVisible = false;
                        }
                    } else {
                        activityText = 'Şu anda bir aktivite yok...';
                        activityDotVisible = false;
                    }

                } else {
                    activityText = 'Şu anda bir aktivite yok...';
                    activityDotVisible = false;
                }

                // 3. Kartı HTML ile güncelleme
                discordCard.innerHTML = `
                    <div class="discord-header">
                        <div style="position: relative;">
                            <img src="https://cdn.discordapp.com/avatars/${DISCORD_ID}/${user.discord_user.avatar}.png?size=1024" alt="Avatar" class="discord-avatar">
                            <span class="status-dot" style="background-color: ${statusColor}; border-color: ${statusColor}; position: absolute; bottom: 0; right: 0;"></span>
                        </div>
                        
                        <div>
                            <span class="discord-username">${user.discord_user.username}</span>
                            <span class="discord-tag">#${user.discord_user.discriminator === '0' ? '' : user.discord_user.discriminator}</span>
                        </div>
                    </div>

                    <div class="status-indicator-wrapper">
                        ${activityDotVisible ? `<span class="activity-dot" style="background-color: ${activityDotColor}; border-color: ${activityDotColor};"></span>` : ''}
                        <span class="discord-status">${activityText}</span>
                    </div>
                `;
                discordCard.style.display = 'block';
                discordCard.classList.remove('loading');

            })
            .catch(error => {
                console.error("Discord verileri çekilirken hata oluştu:", error);
                discordCard.innerHTML = `<span style="color: #f04747;">Discord verileri yüklenemedi.</span>`;
                discordCard.style.display = 'block';
                discordCard.classList.remove('loading');
            });
    };


    // Sayaç için CountAPI.xyz entegrasyonu
    // Kendi namespace'inizi ve key'inizi belirlemeniz önemlidir.
    // Örnek: `https://api.countapi.xyz/hit/YOUR_GITHUB_USERNAME.github.io/BAKI-S2`
    const COUNT_API_NAMESPACE = 'https://bak1kara.github.io/bakikara/'; // Burayı kendi GitHub kullanıcı adınız.github.io ile değiştirin!
    const COUNT_API_KEY = 'bakikara'; // Burayı projenizin adı (repo adı) ile değiştirin

    const fetchVisitorCount = () => {
        fetch(`https://api.countapi.xyz/hit/${COUNT_API_NAMESPACE}/${COUNT_API_KEY}`)
            .then(response => response.json())
            .then(data => {
                if (visitorCountElement) {
                    visitorCountElement.textContent = data.value;
                }
            })
            .catch(error => {
                console.error("Sayaç verileri çekilirken hata oluştu:", error);
                if (visitorCountElement) {
                    visitorCountElement.textContent = '?'; // Hata durumunda soru işareti
                }
            });
    };

    // İlk yüklemede Discord ve Sayaç verilerini çek
    fetchDiscordStatus();
    fetchVisitorCount(); // Sayacı da başlatıyoruz

    // Ardından her 10 saniyede bir Discord verilerini güncelle
    setInterval(fetchDiscordStatus, 10000); 
    // Sayaç değeri her sayfa yüklendiğinde bir artar, yenilemeye gerek yok.
});

