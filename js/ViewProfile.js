const popup=document.getElementById('delete-popup');
const yesbtn=document.getElementById('yesbtn');
const nobtn=document.getElementById('nobtn');
const deletebtn=document.getElementById('btndelete');

deletebtn.addEventListener('click', function(){
    popup.style.display='flex';
});

yesbtn.addEventListener('click', function(){
    popup.style.display='none';
    window.location.href='login.html'
});

nobtn.addEventListener('click', function(){
    popup.style.display='none';
});

