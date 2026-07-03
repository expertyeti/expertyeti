const routes = {
    home: { html: 'html/home.html', css: 'css/home.css', title: 'Inicio' },
    proyectos: { html: 'html/proyectos.html', css: 'css/proyectos.css', title: 'Proyectos' },
    videos: { html: 'html/videos.html', css: 'css/videos.css', title: 'Videos Recientes' },
    juegos: { html: 'html/juegos.html', css: 'css/juegos.css', title: 'Mis Juegos' },
    setup: { html: 'html/setup.html', css: 'css/setup.css', title: 'Mi Setup' }
};

async function loadGitHubRepositoryMetrics() {
    const starsEl = document.getElementById('github-stars');
    const forksEl = document.getElementById('github-forks');
    const issuesEl = document.getElementById('github-issues');

    try {
        const response = await fetch('https://api.github.com/repos/hereswhisper/Genesis-Engine-V2');
        if (response.ok) {
            const data = await response.json();
            if (starsEl) starsEl.innerText = data.stargazers_count;
            if (forksEl) forksEl.innerText = data.forks_count;
            if (issuesEl) issuesEl.innerText = data.open_issues_count;
        }
    } catch (error) {
        console.error("Error al consultar la API de GitHub:", error);
    }
}

async function navigate(routeKey) {
    const route = routes[routeKey];
    if (!route) return;

    try {
        document.title = `Britex - ${route.title}`;
        document.getElementById('category-style').href = route.css;

        const cardElement = document.getElementById('discord-card');
        if (routeKey === 'home') {
            cardElement.classList.remove('compressed');
        } else {
            cardElement.classList.add('compressed');
        }

        const response = await fetch(route.html);
        if (response.ok) {
            const htmlContent = await response.text();
            document.getElementById('card-content').innerHTML = htmlContent;
            
            // ACTUALIZACIÓN DE DATOS INMEDIATA
            if (routeKey === 'home' && typeof updateDiscordStatus === 'function') {
                // Forzar ejecución inmediata saltándose el delay de 5s del setInterval
                updateDiscordStatus(); 
            } else if (routeKey === 'proyectos') {
                loadGitHubRepositoryMetrics();
            }
        } else {
            document.getElementById('card-content').innerHTML = `
                <div style="padding: 40px 20px; text-align: center; color: #949ba4;">
                    <i class="fa-solid fa-code" style="font-size: 28px; margin-bottom: 12px; color:#5865F2;"></i>
                    <p style="margin:0; font-size:14px;">La sección de ${route.title} estará lista muy pronto.</p>
                </div>`;
        }
    } catch (error) {
        console.error("Error del enrutador:", error);
    }
}

document.querySelectorAll('.category-item').forEach(item => {
    item.addEventListener('click', (e) => {
        document.querySelectorAll('.category-item').forEach(i => i.classList.remove('active'));
        const target = e.currentTarget;
        target.classList.add('active');
        navigate(target.getAttribute('data-target'));
    });
});

window.addEventListener('DOMContentLoaded', () => navigate('home'));