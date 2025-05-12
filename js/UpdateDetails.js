const popup=document.getElementById('confirm-popup');
const yesbtn=document.getElementById('yesbtn');
const nobtn=document.getElementById('nobtn');
const form=document.querySelector('.profile-form');

form.addEventListener('submit', function(e) {
    e.preventDefault(); // prevent real form submission
    popup.style.display = 'flex';
  });

yesbtn.addEventListener('click', function(){
    popup.style.display='none';
    window.location.href='ViewProfile.html'
});

nobtn.addEventListener('click', function(){
    popup.style.display='none';
});