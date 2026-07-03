const DISCORD_USER_ID = '1201423206708412420'; 
let activityStartTimestamp = null;
let timerInterval = null;

document.getElementById('menu-toggle').addEventListener('click', () => {
    document.getElementById('profile-container').classList.toggle('expanded');
});

function parseActivityImage(imgId, appId) {
    if (!imgId) return 'assets/placeholder.webp';
    if (imgId.startsWith('mp:external/')) {
        return imgId.replace('mp:external/', 'https://media.discordapp.net/external/');
    } else if (imgId.startsWith('spotify:')) {
        return `https://i.scdn.co/image/${imgId.split(':')[1]}`;
    } else if (appId) {
        return `https://cdn.discordapp.com/app-assets/${appId}/${imgId}.webp`;
    }
    return 'assets/placeholder.webp';
}

function startLiveTimer(startTimestamp) {
    if (timerInterval) clearInterval(timerInterval);
    
    function updateTimerString() {
        const timeElement = document.getElementById('rpc-time');
        if (!timeElement) {
            // Protección: Si el elemento desapareció de la vista (SPA), apagar el reloj
            clearInterval(timerInterval);
            timerInterval = null;
            return;
        } 
        
        const now = Date.now();
        const diff = now - startTimestamp;
        
        if (diff < 0) {
            timeElement.innerText = "00:00 transcurridos";
            return;
        }

        const totalSeconds = Math.floor(diff / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const pad = (num) => String(num).padStart(2, '0');
        
        if (hours > 0) {
            timeElement.innerText = `${pad(hours)}:${pad(minutes)}:${pad(seconds)} transcurridos`;
        } else {
            timeElement.innerText = `${pad(minutes)}:${pad(seconds)} transcurridos`;
        }
    }

    updateTimerString();
    timerInterval = setInterval(updateTimerString, 1000);
}

async function updateDiscordStatus() {
    try {
        // Añadimos un timestamp aleatorio al fetch (?t=...) para saltarnos la caché agresiva del navegador
        const response = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_USER_ID}?t=${Date.now()}`);
        const data = await response.json();

        if (data.success) {
            const discordData = data.data;
            const status = discordData.discord_status;
            
            // Actualizar foto de perfil
            const pfpImg = document.getElementById('pfp-image');
            if (pfpImg && discordData.discord_user.avatar) {
                pfpImg.src = `https://cdn.discordapp.com/avatars/${DISCORD_USER_ID}/${discordData.discord_user.avatar}.webp?size=128`;
            }

            // Actualizar círculo indicador de presencia
            const indicator = document.getElementById('status-indicator');
            if (indicator) {
                indicator.className = 'status-indicator'; 
                if (status === 'online') indicator.classList.add('status-online');
                else if (status === 'idle') indicator.classList.add('status-idle');
                else if (status === 'dnd') indicator.classList.add('status-dnd');
            }

            // Comprobar si los elementos RPC de la vista 'Inicio' están montados en el DOM actual
            const rpcContainer = document.getElementById('rpc-container');
            const rpcName = document.getElementById('rpc-name');
            const rpcDetails = document.getElementById('rpc-details');
            const rpcState = document.getElementById('rpc-state');
            const rpcMainImg = document.getElementById('rpc-main-img');
            const rpcSubImg = document.getElementById('rpc-sub-img');
            const rpcTime = document.getElementById('rpc-time');

            if (rpcContainer && rpcName && rpcDetails && rpcState && rpcMainImg && rpcSubImg && rpcTime) {
                const activities = discordData.activities;
                
                if (activities && activities.length > 0) {
                    // Filtrar actividad de tipo juego (0) o transmisión (1)
                    const game = activities.find(a => a.type === 0 || a.type === 1); 
                    
                    if (game) {
                        rpcName.innerText = game.name;
                        rpcDetails.innerText = game.details || '';
                        rpcState.innerText = game.state || '';
                        
                        const largeImgId = game.assets ? game.assets.large_image : null;
                        rpcMainImg.src = parseActivityImage(largeImgId, game.application_id);

                        const smallImgId = game.assets ? game.assets.small_image : null;
                        if (smallImgId) {
                            rpcSubImg.src = parseActivityImage(smallImgId, game.application_id);
                            rpcSubImg.style.display = 'block';
                        } else {
                            rpcSubImg.style.display = 'none';
                        }

                        if (game.timestamps && game.timestamps.start) {
                            if (activityStartTimestamp !== game.timestamps.start) {
                                activityStartTimestamp = game.timestamps.start;
                                startLiveTimer(activityStartTimestamp);
                            }
                            rpcTime.style.display = 'block';
                        } else {
                            if (timerInterval) clearInterval(timerInterval);
                            rpcTime.style.display = 'none';
                            activityStartTimestamp = null;
                        }

                        rpcContainer.style.display = 'block';
                    } else {
                        rpcContainer.style.display = 'none';
                        if (timerInterval) clearInterval(timerInterval);
                    }
                } else {
                    rpcContainer.style.display = 'none';
                    if (timerInterval) clearInterval(timerInterval);
                }
            } else {
                // Limpieza absoluta de intervalos en caché al estar fuera de 'Inicio'
                if (timerInterval) {
                    clearInterval(timerInterval);
                    timerInterval = null;
                }
                activityStartTimestamp = null;
            }
        }
    } catch (error) {
        console.error("Error consultando Lanyard API:", error);
    }
}

// Inicialización instantánea y loop estricto cada 5 segundos
updateDiscordStatus();
setInterval(updateDiscordStatus, 5000);