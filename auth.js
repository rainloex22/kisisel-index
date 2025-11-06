// auth.js - FULL Yetkilendirme (Auth) ve UI Yönetimi

// NOT: Bu dosyanın çalışması için HTML dosyanızda <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
// kütüphanesinin yüklenmiş olması gerekmektedir.

// --- KRİTİK SABİTLER (DEĞİŞMEYENLER) ---
const SUPABASE_URL = 'https://ywxhworspkocuzsygsgc.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3eGh3b3JzcGtvY3V6c3lnc2djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MzEzMTcsImV4cCI6MjA3ODAwNzMxN30.x7IMaG9C1bF8_RIbv50NfyeymsTu5cwsBRnQy9ZRa8Y'; 
const RENDER_API_URL = 'https://sosyalpro-api-1.onrender.com'; 

// Supabase istemcisini oluştur
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// =========================================================================
// UI YÖNETİMİ: Giriş Durumuna Göre Arayüzü Günceller
// =========================================================================

/**
 * Kullanıcı oturum durumuna göre CTA butonlarını ve yorum formunu günceller.
 * @param {object} session - Supabase oturum nesnesi.
 */
function updateUIForAuth(session) {
    const loginCta = document.getElementById('login-cta');
    const logoutCta = document.getElementById('logout-cta');
    const commentForm = document.getElementById('yorum-gonder-formu');
    const commentWarning = document.getElementById('comment-login-warning');

    if (session?.user) {
        // Kullanıcı giriş yapmış
        if (loginCta) loginCta.classList.add('hidden');
        if (logoutCta) logoutCta.classList.remove('hidden');
        if (commentForm) commentForm.classList.remove('hidden');
        if (commentWarning) commentWarning.classList.add('hidden');
        
    } else {
        // Kullanıcı giriş yapmamış
        if (loginCta) loginCta.classList.remove('hidden');
        if (logoutCta) logoutCta.classList.add('hidden');
        if (commentForm) commentForm.classList.add('hidden');
        if (commentWarning) commentWarning.classList.remove('hidden');
    }
}


// =========================================================================
// YETKİLENDİRME (AUTH) İŞLEMLERİ
// =========================================================================

/**
 * Supabase Magic Link ile kullanıcı girişi sağlar.
 */
async function signInWithMagicLink() {
    const email = prompt("Lütfen e-posta adresinizi giriniz:");
    if (!email) return;

    const { error } = await supabase.auth.signInWithOtp({ 
        email, 
        options: {
            emailRedirectTo: window.location.origin + window.location.pathname // Aynı sayfaya geri yönlendir
        }
    });

    if (error) {
        showAlert(`Giriş hatası: ${error.message}`, 'red');
    } else {
        showAlert('E-posta adresinize bir giriş bağlantısı gönderildi. Lütfen gelen kutunuzu kontrol edin.');
    }
}

/**
 * Kullanıcının oturumunu sonlandırır.
 */
async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        showAlert(`Çıkış hatası: ${error.message}`, 'red');
    } else {
        showAlert('Başarıyla çıkış yaptınız.');
        updateUIForAuth(null);
    }
}


// =========================================================================
// YORUM İŞLEMLERİ
// =========================================================================

/**
 * API'yi kullanarak yeni bir yorum gönderir.
 * @param {string} pageSlug - Yorumun ait olduğu sayfanın slug'ı.
 * @param {string} userId - Yorumu gönderen kullanıcının Supabase ID'si.
 * @param {string} userName - Yorumu gönderen kullanıcının adı/rumuzu.
 * @param {string} content - Yorum içeriği.
 * @returns {boolean} - İşlem başarılıysa true, aksi halde false.
 */
async function sendComment(pageSlug, userId, userName, content) {
    try {
        const response = await fetch(`${RENDER_API_URL}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Supabase JWT'yi de header olarak gönderebilirsiniz (Opsiyonel)
                'Authorization': `Bearer ${supabase.auth.session()?.access_token || ''}`
            },
            body: JSON.stringify({
                page_slug: pageSlug,
                user_id: userId,
                user_name: userName,
                content: content
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Yorum gönderme başarısız oldu.');
        }

        return true;
    } catch (error) {
        showAlert(`Yorum gönderme hatası: ${error.message}`, 'red');
        return false;
    }
}

// =========================================================================
// ANA İŞLEVLER (DOM YÜKLENDİĞİNDE ÇALIŞIR)
// =========================================================================

document.addEventListener('DOMContentLoaded', async () => {

    // A. Oturum Kontrolü ve UI Güncellemesi
    const { data: { session } } = await supabase.auth.getSession();
    updateUIForAuth(session);

    // B. Oturum Değişikliklerini Dinleme
    supabase.auth.onAuthStateChange((event, session) => {
        updateUIForAuth(session);
        // İhtiyaç duyulursa burada, sayfa slug'ı tanımlıysa yorumları yeniden yükleyebilirsiniz.
        // if (window.CURRENT_PAGE_SLUG && (event === 'SIGNED_IN' || event === 'SIGNED_OUT')) {
        //     loadComments(window.CURRENT_PAGE_SLUG);
        // }
    });
    
    // C. Giriş/Çıkış Buton Listener'ları
    const loginCta = document.getElementById('login-cta');
    if (loginCta) {
        loginCta.addEventListener('click', signInWithMagicLink);
    }

    const logoutCta = document.getElementById('logout-cta');
    if (logoutCta) {
        logoutCta.addEventListener('click', signOut);
    }

    // D. Yorum Gönderme Formu Listener'ı
    const commentForm = document.getElementById('yorum-gonder-formu');
    
    // **CRITICAL CHECK** : Eğer CURRENT_PAGE_SLUG tanımlıysa formu dinlemeye başla.
    if (commentForm && window.CURRENT_PAGE_SLUG) { 
        commentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const commentText = document.getElementById('comment-content').value;
            const { data: { user } } = await supabase.auth.getSession();
            
            if (!user) {
                // Bu durum teorik olarak oluşmamalı (UI gizleniyor), ama bir güvenlik kontrolü.
                showAlert('Yorum göndermek için lütfen önce giriş yapın.', 'red');
                return;
            }
            
            const userId = user.id;
            // Kullanıcının tam adını veya yoksa e-postasının ilk kısmını kullan
            const userName = user.user_metadata?.full_name || user.email.split('@')[0];

            const result = await sendComment(window.CURRENT_PAGE_SLUG, userId, userName, commentText);
            
            if (result) {
                showAlert('Yorumunuz başarıyla gönderildi!');
                commentForm.reset();
                // Yorumlar listesini güncelle (Bu fonksiyon HTML'inizde görünmüyorsa yorum listesi güncellenmeyecektir)
                // loadComments(window.CURRENT_PAGE_SLUG); 
            }
        });
    }
    
    // E. Sayfa Yüklendiğinde Yorumları Çekme
    if (window.CURRENT_PAGE_SLUG) {
        // loadComments(window.CURRENT_PAGE_SLUG);
        // NOT: Yorum listesini HTML'de nasıl göstereceğiniz (renderComments) 
        // fonksiyonu tanımlanmadığı için bu satır şimdilik yorum satırı olarak bırakılmıştır.
    }
});
