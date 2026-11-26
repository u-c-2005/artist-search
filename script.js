/* ------------------- EECS 493 Assignment 5 Starter Code ------------------ */

// Loads Vue. The version number is fixed so that the library cannot change
// while you are working. Leave this line as it is.
import { createApp } from 'https://unpkg.com/vue@3.5.13/dist/vue.esm-browser.prod.js'

createApp({
  data() {
    return {
      // Placeholders, so that index.html has something to render before you
      // have written the search. Both are gone once real results arrive.
      search_term: '',
      results: [],
      has_searched: false,
      active_tabs: {},
      selected_genres: ['ALL'],
      sort_type: 'original',
      sort_open: false,
      search_history: [],
      history_open: false,
      hovered_history: null,
      favorites: [],
      hovered_favorite: null,
      current_track: null,
      audio: null,
      is_playing: false,
      is_repeating: false,
      volume: 50,
      progress: 0,
      favorites_open: true
    }
  },

  computed: {
    genres() {
      return [...new Set (
        this.results.map(track => track.primaryGenreName)
      )].filter(genre => genre);
    },

    displayed_results() {
      let tracks = [...this.results];
    
      if (!this.selected_genres.includes('ALL')) {
        tracks = tracks.filter(track =>
          this.selected_genres.includes(track.primaryGenreName)
        );
      }
    
      if (this.sort_type === 'collection') {
        tracks.sort((a, b) =>
          this.get_info(a.collectionName).localeCompare(
            this.get_info(b.collectionName)
          )
        );
      } else if (this.sort_type === 'price') {
        tracks.sort((a, b) =>
          (a.collectionPrice ?? 0) - (b.collectionPrice ?? 0)
        );
      }
    
      return tracks;
    },

    visible_history() {
      return this.search_history.slice(0, 5);
    },
  },

  methods: {
    handle_key(event) {
      if (event.key === 'Enter') {
        this.search_artist();
      }
    },
    async search_artist(){
      const term = this.search_term.trim();

      if(term === ''){
        return;
      }

      this.add_history(term);
      this.close_history();

      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&attribute=artistTerm`;

      const response = await fetch(url);
      const data = await response.json();

      console.log(data);
      this.results = data.results;
      this.active_tabs = {};
      this.selected_genres = ['ALL'];
      this.sort_type = 'original';
      this.sort_open = false;
      this.has_searched = true;
      if (this.results.length === 0) {
        alert("No artist found with this keyword.");
      }
    },
    get_artwork(track) {
      return track.artworkUrl100 ||
             track.artworkUrl60 ||
             track.artworkUrl30;
    },
    
    get_info(value) {
      if (value === undefined || value === null || value === '') {
        return 'No information provided';
      }
      return value;
    },
    
    select_tab(track_id, tab) {
      this.active_tabs[track_id] = tab;
    },
    
    get_tab(track_id) {
      return this.active_tabs[track_id] || 'description';
    },

    select_genre(genre){
      if(genre === 'ALL'){
        this.selected_genres = ['ALL'];
      }
      else{
        this.selected_genres = this.selected_genres.filter(
          item => item !== 'ALL');
          
          if(this.selected_genres.includes(genre)){
            this.selected_genres = this.selected_genres.filter(
              item => item !== genre);
          }
          else{
            this.selected_genres.push(genre);
          }
          if(this.selected_genres.length === 0) {
            this.selected_genres = ['ALL'];
          }
      }
    },

    toggle_sort() {
      this.sort_open = !this.sort_open;
    },
    
    select_sort(type) {
      this.sort_type = type;
      this.sort_open = false;
    },

    add_history(term){
      this.search_history = this.search_history.filter(
        item => item.toLowerCase() != term.toLowerCase()
      );
      this.search_history.unshift(term);
    },

    open_history(){
      this.history_open = true;
    },

    close_history(){
      this.history_open = false;
    },

    delete_history(term){
      this.search_history = this.search_history.filter(
        item => item !== term
      );
    },

    search_from_history(term){
      this.search_term = term;
      this.search_artist();
    },

    is_favorite(track_id) {
      return this.favorites.some(
        track => track.trackId === track_id
      );
    },
    
    toggle_favorite(track) {
      if (this.is_favorite(track.trackId)) {
        this.remove_favorite(track.trackId);
      } else {
        this.favorites.push(track);
      }
    },
    
    remove_favorite(track_id) {
      this.favorites = this.favorites.filter(
        track => track.trackId !== track_id
      );
    },

    play_track(track) {
      if (!track || !track.previewUrl) {
        alert("No audio is available for this track.");
        return;
      }
    
      if (this.current_track &&
          this.current_track.trackId === track.trackId) {
        this.toggle_play();
        return;
      }
    
      if (this.audio) {
        this.audio.ontimeupdate = null;
        this.audio.onended = null;
        this.audio.pause();
      }
      
      this.is_playing = false;
    
      this.current_track = track;
      this.progress = 0;
    
      this.audio = new Audio(track.previewUrl);
      this.audio.volume = this.volume / 100;
      this.audio.loop = this.is_repeating;
    
      this.audio.ontimeupdate = () => {
        if (this.audio.duration) {
          this.progress =
            (this.audio.currentTime / this.audio.duration) * 100;
        }
      };
    
      this.audio.onended = () => {
        this.is_playing = false;
        this.progress = 0;
        this.audio.currentTime = 0;
      };
    
      this.audio.play().then(() => {
        this.is_playing = true;
      }).catch(() => {
        this.is_playing = false;
      });
    },
    
    toggle_play() {
      if (!this.audio) {
        return;
      }
    
      if (this.is_playing) {
        this.audio.pause();
        this.is_playing = false;
      } else {
        this.audio.play().then(() => {
          this.is_playing = true;
        }).catch(() => {
          this.is_playing = false;
        });
      }
    },
    
    is_track_playing(track_id) {
      return this.current_track !== null &&
             this.current_track.trackId === track_id &&
             this.is_playing;
    },

    next_track() {
      const tracks = this.results.filter(track =>
        track.previewUrl &&
        (!this.current_track ||
         track.trackId !== this.current_track.trackId)
      );
    
      if (tracks.length === 0) {
        return;
      }
    
      const random_index = Math.floor(
        Math.random() * tracks.length
      );
    
      this.play_track(tracks[random_index]);
    },
    
    toggle_repeat() {
      this.is_repeating = !this.is_repeating;
    
      if (this.audio) {
        this.audio.loop = this.is_repeating;
      }
    },
    
    update_volume() {
      if (this.audio) {
        this.audio.volume = this.volume / 100;
      }
    },

    toggle_favorites() {
      this.favorites_open = !this.favorites_open;
    }

  }
}).mount('#app')
