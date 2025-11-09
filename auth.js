// ==============================================================================
// 🎯 Supabase Yapılandırması
// ==============================================================================
const SUPABASE_URL = 'https://pkwqrupzawkwnpkqijqw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrd3FydXB6YXdrd25wa3FpanF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTIxMTcsImV4cCI6MjA3ODI2ODExN30.YJ5j_qeUFyCbsoVcFhXzobRx4-wbjULbZBB3FRB1p2o';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==============================================================================
// 🚀 Yardımcı Fonksiyonlar
// ==============================================================================

// Global Alert fonksiyonu
function showGlobalAlert(message, type = 'green') {
    if (typeof window.showAlert === 'function') {
        window.showAlert(message, type);
    } else {
        console.warn('showAlert fonksiyonu bulunamadı. Mesaj:', message);
    }
}

// Oturum durumuna göre sayfa elementlerini günceller.
function updateUI(user) {
    const isUserLoggedIn = !!user;
    
    // Genel Navigasyon Elementleri
    const loginCta = document.getElementById('login-cta'); // Fiyatlar.html
    const logoutCta = document.getElementById('logout-cta'); // Fiyatlar.html
    const authButtons = document.getElementById('auth-buttons'); // Sosyal.html
    const profileArea = document.getElementById('profile-area'); // Sosyal & Fiyatlar.html
    const userInfo = document.getElementById('user-info'); // Sosyal & Fiyatlar.html
    
    // Yorum Bölümü Elementleri
    const commentLoginWarning = document.getElementById('comment-login-warning');
    const yorumGonderFormu = document.getElementById('yorum-gonder-formu');
    
    // Yorum Bölümü Elementleri (Sosyal.html)
    const authFormAreaSosyal = document.getElementById('auth-form-area');
    const commentInputAreaSosyal = document.getElementById('comment-input-area');
    
    // Navbar UI Güncelleme (Fiyatlar.html ve Sosyal.html'deki aynı ID'ler)
    if (loginCta) { 
        loginCta.classList.toggle('hidden', isUserLoggedIn); // Giriş/Kayıt butonunu gizle
    }
    
    if (authButtons) {
        authButtons.classList.toggle('hidden', isUserLoggedIn); // Giriş/Kayıt butonlarını gizle (Sosyal.html)
    }

    if (profileArea) {
         profileArea.classList.toggle('hidden', !isUserLoggedIn); // Profil alanını göster
    }
    
    // Kullanıcı Adını Göster
    if (isUserLoggedIn && userInfo && user.email) {
        userInfo.textContent = user.email.split('@')[0]; // E-posta adının ilk kısmını göster
    }
    
    // Yorum UI Güncelleme
    if (commentLoginWarning && yorumGonderFormu) {
        commentLoginWarning.classList.toggle('hidden', isUserLoggedIn);
        yorumGonderFormu.classList.toggle('hidden', !isUserLoggedIn);
    }

    if (authFormAreaSosyal && commentInputAreaSosyal) {
        authFormAreaSosyal.classList.toggle('hidden', isUserLoggedIn);
        commentInputAreaSosyal.classList.toggle('hidden', !isUserLoggedIn);
    }
    
    fetchComments();
}

// Yorumları Supabase'den çekme (Değişmedi)
async function fetchComments() {
    const commentsList = document.getElementById('comments-list');
    if (!commentsList) return;
    
    const pageSlug = window.CURRENT_PAGE_SLUG; 
    
    try {
        const { data: comments, error } = await supabase
            .from('comments')
            .select('content, user_email, created_at')
            .eq('page_slug', pageSlug)
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        // ... (Yorumları işleme mantığı - Değişmedi)
        if (pageSlug === 'fiyatlar') {
            const staticComments = commentsList.querySelectorAll('.primary-dark:not(.dynamic-comment)');
            commentsList.innerHTML = '';
            staticComments.forEach(comment => commentsList.appendChild(comment));
        } else {
             commentsList.innerHTML = '';
        }
        
        if (comments.length === 0 && pageSlug !== 'fiyatlar') {
             commentsList.innerHTML = '<p class="text-center text-gray-500">Henüz yorum yapılmamış.</p>';
        }

        comments.forEach(comment => {
            const commentDiv = document.createElement('div');
            commentDiv.className = 'p-5 primary-dark rounded-xl border border-slate-700 dynamic-comment';
            
            const userPart = comment.user_email ? comment.user_email.split('@')[0] : 'Anonim';
            const timeAgo = new Date(comment.created_at).toLocaleDateString('tr-TR');

            commentDiv.innerHTML = `
                <p class="text-sm font-semibold text-green-400">${userPart}</p>
                <p class="text-gray-500 text-xs mt-1">${timeAgo}</p>
                <p class="text-gray-300 mt-2">${comment.content}</p>
            `;
            commentsList.appendChild(commentDiv);
        });
        
    } catch (error) {
        console.error('Yorumları çekerken hata:', error.message);
    }
}

// ==============================================================================
// 🔑 Auth İşlevleri
// ==============================================================================

// ⭐ DÜZELTİLDİ: Oturum Açma / Kayıt Olma Modalı (Fiyatlar.html için)
async function handleAuthFormFiyatlar(event) {
    event.preventDefault();
    const form = event.target;
    // Element erişimini form üzerinden yap
    const email = form.querySelector('#auth-email-modal').value;
    const password = form.querySelector('#auth-password-modal').value;
    const isSignUpMode = form.querySelector('#auth-submit-btn-modal').textContent.includes('Kayıt Ol');

    try {
        let response;
        if (isSignUpMode) {
            response = await supabase.auth.signUp({ email, password });
        } else {
            response = await supabase.auth.signInWithPassword({ email, password });
        }
        
        const { data, error } = response;

        if (error) throw error;
        
        showGlobalAlert(isSignUpMode ? 'Kayıt başarılı! Hesabınıza giriş yapıldı.' : 'Başarıyla giriş yapıldı!', 'green');
        
        // Modalı kapat
        document.getElementById('auth-modal').classList.add('hidden');
        document.body.classList.remove('overflow-hidden');

        // Şifre alanını temizle
        form.querySelector('#auth-password-modal').value = '';

        // ⭐ KRİTİK DÜZELTME: UI'yı manuel olarak güncelle
        // Bu, onAuthStateChange tetiklenmese bile profil kartının hemen gözükmesini sağlar.
        if (data.user) {
             updateUI(data.user); 
        }

    } catch (error) {
        showGlobalAlert('Hata: ' + error.message, 'red');
        console.error('Auth Hatası:', error);
    }
}


// Oturum Açma / Kayıt Olma Formu (Sosyal.html için - Değişmedi)
async function handleAuthFormSosyal(event) {
    event.preventDefault();
    const form = event.target;
    const email = form.querySelector('#auth-email').value;
    const password = form.querySelector('#auth-password').value;
    const isSignUpMode = form.querySelector('#auth-submit-btn').textContent.includes('Kayıt Ol');

    try {
        let response;
        if (isSignUpMode) {
            response = await supabase.auth.signUp({ 
                email, 
                password,
            });
        } else {
            response = await supabase.auth.signInWithPassword({ email, password });
        }
        
        const { data, error } = response;

        if (error) throw error;
        
        showGlobalAlert(isSignUpMode ? 'Kayıt başarılı! Hesabınıza giriş yapıldı.' : 'Başarıyla giriş yapıldı!', 'green');
        
        form.querySelector('#auth-password').value = '';

    } catch (error) {
        showGlobalAlert('Hata: ' + error.message, 'red');
        console.error('Auth Hatası:', error);
    }
}

// Oturum Kapatma (Değişmedi)
async function handleLogout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        showGlobalAlert('Başarıyla çıkış yapıldı.', 'green');
    } catch (error) {
        showGlobalAlert('Çıkış yaparken hata oluştu: ' + error.message, 'red');
        console.error('Çıkış Hatası:', error);
    }
}

// Yorum Gönderme İşlevi (Değişmedi)
async function handleCommentSubmit(event) {
    event.preventDefault();
    const content = event.target.querySelector('#comment-content').value;
    const user = (await supabase.auth.getSession()).data.session?.user;

    if (!user) {
        showGlobalAlert('Yorum göndermek için lütfen önce giriş yapın.', 'red');
        return;
    }

    try {
        const { error } = await supabase
            .from('comments')
            .insert([
                { 
                    content: content, 
                    user_id: user.id, 
                    user_email: user.email,
                    page_slug: window.CURRENT_PAGE_SLUG 
                },
            ]);

        if (error) throw error;

        showGlobalAlert('Yorumunuz başarıyla gönderildi!', 'green');
        event.target.reset(); 
        fetchComments();
        
    } catch (error) {
        showGlobalAlert('Yorum gönderilirken hata oluştu: ' + error.message, 'red');
        console.error('Yorum Gönderme Hatası:', error);
    }
}

// ==============================================================================
// 📌 Event Dinleyicileri
// ==============================================================================

document.addEventListener('DOMContentLoaded', () => {
    
    // Oturum Durumu Kontrolü ve UI Güncellemesi
    supabase.auth.getSession().then(({ data: { session } }) => {
        updateUI(session?.user || null);
    });
    
    supabase.auth.onAuthStateChange((event, session) => {
        updateUI(session?.user || null);
    });
    
    // --- Fiyatlar.html için Element Dinleyicileri ---
    
    // Auth Modal Açma
    const loginCta = document.getElementById('login-cta');
    const authModal = document.getElementById('auth-modal');
    if (loginCta && authModal) {
        loginCta.addEventListener('click', () => {
            authModal.classList.remove('hidden');
            document.body.classList.add('overflow-hidden');
            // Mod açılırken varsayılan olarak Giriş Yap moduna ayarla
            const isSignUp = document.getElementById('auth-submit-btn-modal').textContent.includes('Kayıt Ol');
            if (isSignUp) {
                document.getElementById('toggle-auth-mode-modal').click();
            }
        });
    }
    
    // Auth Modal Kapatma
    const closeModalBtn = document.getElementById('close-modal-btn');
    if (closeModalBtn && authModal) {
        closeModalBtn.addEventListener('click', () => {
            authModal.classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
        });
    }

    // Auth Modal Formu Gönderimi (Fiyatlar.html)
    const authFormModalFiyatlar = document.getElementById('auth-form-modal');
    if (authFormModalFiyatlar) {
        authFormModalFiyatlar.addEventListener('submit', handleAuthFormFiyatlar);
    }
    
    // Kayıt Ol / Giriş Yap Modu Değiştirme (Fiyatlar.html Modal)
    const toggleAuthModeModal = document.getElementById('toggle-auth-mode-modal');
    const authSubmitBtnModal = document.getElementById('auth-submit-btn-modal');
    const modalAuthTitle = document.getElementById('modal-auth-title');
    const modalAuthDescription = document.getElementById('modal-auth-description');

    if (toggleAuthModeModal && authSubmitBtnModal && modalAuthTitle && modalAuthDescription) {
        toggleAuthModeModal.addEventListener('click', () => {
            const isSignUp = authSubmitBtnModal.textContent.includes('Kayıt Ol');
            
            authSubmitBtnModal.textContent = isSignUp ? 'Giriş Yap' : 'Kayıt Ol';
            toggleAuthModeModal.textContent = isSignUp ? 'Kayıt Ol' : 'Giriş Yap';
            modalAuthTitle.textContent = isSignUp ? 'Giriş Yap' : 'Kayıt Ol';
            modalAuthDescription.textContent = isSignUp 
                ? 'Hesabınıza erişmek için e-posta ve şifrenizi girin.' 
                : 'Yeni bir hesap oluşturmak için e-posta ve şifrenizi girin.';
        });
    }
    
    // Oturum Kapatma (Fiyatlar.html)
    const logoutCta = document.getElementById('logout-cta');
    if (logoutCta) {
        logoutCta.addEventListener('click', handleLogout);
    }
    
    // Yorum Gönderme Formu (Fiyatlar.html)
    const yorumGonderFormuFiyatlar = document.getElementById('yorum-gonder-formu');
    if (yorumGonderFormuFiyatlar) {
        yorumGonderFormuFiyatlar.addEventListener('submit', handleCommentSubmit);
    }
    
    // --- Sosyal.html için Element Dinleyicileri ---
    
    // Auth Formu Gönderimi (Sosyal.html)
    const authFormSosyal = document.getElementById('auth-form');
    const authSubmitBtn = document.getElementById('auth-submit-btn');
    const toggleAuthMode = document.getElementById('toggle-auth-mode');
    const authTitle = document.getElementById('auth-title');
    
    if (authFormSosyal) {
        authFormSosyal.addEventListener('submit', handleAuthFormSosyal);
    }

    // Oturum Kapatma (Sosyal.html)
    const logoutButtonSosyal = document.getElementById('logout-button');
    if (logoutButtonSosyal) {
        logoutButtonSosyal.addEventListener('click', handleLogout);
    }

    // Kayıt Ol / Giriş Yap Modu Değiştirme (Sosyal.html)
    if (toggleAuthMode && authSubmitBtn && authTitle) {
        toggleAuthMode.addEventListener('click', () => {
            const isSignUp = authSubmitBtn.textContent.includes('Kayıt Ol');
            
            authSubmitBtn.textContent = isSignUp ? 'Giriş Yap' : 'Kayıt Ol';
            toggleAuthMode.textContent = isSignUp ? 'Kayıt Ol' : 'Giriş Yap';
            authTitle.textContent = isSignUp ? 'Giriş Yap' : 'Kayıt Ol';
        });
    }

    // Yorum Gönderme Formu (Sosyal.html)
    const yorumGonderFormuSosyal = document.getElementById('yorum-gonder-formu');
    if (yorumGonderFormuSosyal) {
        yorumGonderFormuSosyal.addEventListener('submit', handleCommentSubmit);
    }
    
    // Yorumlar sayfasının ilk yüklenişinde yorumları çek
    if (document.getElementById('comments-list')) {
        fetchComments();
    }
});
