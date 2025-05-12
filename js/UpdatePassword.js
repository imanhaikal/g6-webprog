const popup=document.getElementById('password-popup');
const yesbtn=document.getElementById('yesbtn');
const nobtn=document.getElementById('nobtn');
const form=document.querySelector('.password-form');

form.addEventListener('submit', function(e) {
    e.preventDefault();
    popup.style.display = 'flex';
  });

yesbtn.addEventListener('click', function(){
    popup.style.display='none';
    window.location.href='ViewProfile.html'
});

nobtn.addEventListener('click', function(){
    popup.style.display='none';
});