let currentAudio = null;
let currentTrackIndex = -1;
let tracks = [];

async function loadTracks() {
  try {
    const res = await fetch('/tracks', { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error('Failed to fetch tracks');
    const data = await res.json();
    tracks = data.tracks || [];

    const trackList = document.getElementById('track-list');
    if (trackList) trackList.innerHTML = "";

    if (tracks.length === 0) {
      console.log('No tracks found. Upload some audio files!');
      return;
    }

    tracks.forEach((track, index) => {
      const card = document.createElement('div');
      card.className = 'track-card';
      card.textContent = track;
      card.addEventListener('click', () => playTrack(index));
      trackList.appendChild(card);
    });
  } catch (err) {
    console.error('Error loading tracks:', err);
  }
}

function playTrack(index) {
  if (currentAudio) currentAudio.pause();
  currentTrackIndex = index;
  const track = tracks[index];
  currentAudio = new Audio(`/audio/${track}`);
  currentAudio.play();

  document.getElementById('currentTrack').textContent = track;
  document.querySelector('.btn.play').textContent = "⏸";

  // 🔥 NEW PART: highlight active track
  document.querySelectorAll('.track-card').forEach(card => {
    card.classList.remove('active');   // remove highlight from all
  });
  const trackList = document.getElementById('track-list');
  trackList.children[index].classList.add('active'); // highlight current

  currentAudio.ontimeupdate = () => {
    const progress = (currentAudio.currentTime / currentAudio.duration) * 100;
    document.getElementById('progressBar').style.width = progress + "%";
  };

  currentAudio.onended = () => {
    if (currentTrackIndex < tracks.length - 1) {
      playTrack(currentTrackIndex + 1);
    } else {
      playTrack(0); // continuous loop
    }
  };
}

// Controls - safely attach listeners
const playBtn = document.querySelector('.btn.play');
const nextBtn = document.querySelector('.btn.next');
const prevBtn = document.querySelector('.btn.prev');

if (playBtn) {
  playBtn.addEventListener('click', () => {
    if (!currentAudio) {
      if (tracks.length > 0) playTrack(0);
      return;
    }
    if (currentAudio.paused) {
      currentAudio.play();
      playBtn.textContent = "⏸";
    } else {
      currentAudio.pause();
      playBtn.textContent = "▶";
    }
  });
}

if (nextBtn) {
  nextBtn.addEventListener('click', () => {
    if (currentTrackIndex < tracks.length - 1) playTrack(currentTrackIndex + 1);
  });
}

if (prevBtn) {
  prevBtn.addEventListener('click', () => {
    if (currentTrackIndex > 0) playTrack(currentTrackIndex - 1);
  });
}

// Upload
const uploadBtn = document.getElementById('uploadBtn');
const fileInput = document.getElementById('fileInput');

if (uploadBtn) {
  uploadBtn.addEventListener('click', () => {
    fileInput.click();
  });
}

if (fileInput) {
  fileInput.addEventListener('change', async (e) => {
    try {
      const formData = new FormData();
      for (let file of e.target.files) {
        formData.append('file', file);
      }

      const res = await fetch('/upload', {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(10000)
      });

      if (res.ok) {
        loadTracks();
      } else {
        console.error('Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
    }
  });
}

// Load initial tracks
loadTracks();

// Load main animation - with error handling
const mainAnimContainer = document.getElementById('mainAnim');
if (mainAnimContainer && typeof lottie !== 'undefined') {
  try {
    lottie.loadAnimation({
      container: mainAnimContainer,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: '/static/hug-animation.json'
    });
  } catch (err) {
    console.warn('Failed to load animation:', err);
    mainAnimContainer.textContent = '🎵';
  }
} else {
  console.warn('Animation container or Lottie not found');
}

