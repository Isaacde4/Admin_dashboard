// ---------------- GLOBAL VARIABLES ----------------
let allStaff = [];
let selectedStaffId = null;

// ---------------- SIDEBAR NAVIGATION ----------------
function showSection(sectionId, event){
  ['dashboard','staff','reports'].forEach(id => {
    document.getElementById(id).style.display = (id === sectionId) ? 'block' : 'none';
  });
  document.querySelectorAll('.sidebar a').forEach(link => link.classList.remove('active'));
  event.currentTarget.classList.add('active');
}

// ---------------- TOGGLE STAFF FORM ----------------
function toggleStaffForm(){
  const form = document.getElementById('staffForm');
  const btn = document.getElementById('showFormBtn');
  if(form.style.display === 'none'){
    form.style.display = 'block';
    btn.innerHTML = 'Hide Form';
  } else {
    form.style.display = 'none';
    btn.innerHTML = '<i class="fas fa-user-plus"></i> Create Staff';
  }
}

// ---------------- DASHBOARD COUNTS & WELCOME ----------------
async function loadDashboard(){
  try {
    const { data: staff, error } = await window.supabaseClient
      .from("staff")
      .select("*");
    if(error) throw error;
    
    document.getElementById("totalStaff").textContent = staff.length;
    document.getElementById("totalAdmins").textContent = staff.filter(s => s.is_admin).length;

    // Show logged-in email as welcome
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    const email = user ? user.email : "Admin";
    document.getElementById("status").textContent = `Welcome, ${email}`;
  } catch(e){
    console.error("Dashboard load error:", e.message);
    document.getElementById("status").textContent = "Welcome";
  }
}

// ---------------- LOAD STAFF GRID ----------------
async function loadStaffList(){
  try {
    const { data: staff, error } = await window.supabaseClient
      .from("staff")
      .select("*");
    if(error) throw error;

    allStaff = staff;
    displayStaffGrid(staff);
  } catch(e){
    console.error("Staff list load error:", e.message);
  }
}

// ---------------- DISPLAY STAFF GRID ----------------
function displayStaffGrid(staffArray){
  const grid = document.getElementById("staffGrid");
  grid.innerHTML = "";

  staffArray.forEach(s => {
    const card = document.createElement("div");
    card.className = "staff-card";

    // Use uploaded image or reliable placeholder
    const imgSrc = s.image_url || "https://dummyimage.com/150x150/cccccc/000000.png&text=No+Image";
    card.innerHTML = `
      <img src="${imgSrc}" alt="${s.full_name}">
      <p>${s.full_name}</p>
      ${s.is_admin ? '<span class="badge">Admin</span>' : ''}
    `;

    // Open modal on click
    card.addEventListener("click", () => showStaffModal(s));
    grid.appendChild(card);
  });
}

// ---------------- CREATE STAFF ----------------
async function createStaff(){
  const full_name = document.getElementById("full_name").value;
  const staff_id = document.getElementById("staff_id").value;
  const role = document.getElementById("role").value;
  const department = document.getElementById("department").value;
  const email = document.getElementById("email").value;
  const phone = document.getElementById("phone").value;
  const is_admin = document.getElementById("is_admin").checked;
  const fileInput = document.getElementById("staffImage");
  let image_url = null;

  // Upload image if provided
  if(fileInput.files.length > 0){
    const file = fileInput.files[0];
    const fileName = `${Date.now()}_${file.name.replace(/\s/g,'_')}`;

    const { data, error } = await window.supabaseClient
      .storage
      .from('staff_images')
      .upload(fileName, file);

    if(error){ 
      console.error("Image upload failed:", error.message);
      document.getElementById("message").textContent = "Image upload failed!";
      return; 
    }

    const { publicUrl } = window.supabaseClient
      .storage
      .from('staff_images')
      .getPublicUrl(fileName);
    image_url = publicUrl;
  }

  try {
    const { error } = await window.supabaseClient
      .from("staff")
      .insert([{ full_name, staff_id, role, department, email, phone, is_admin, image_url }]);
    if(error) throw error;

    document.getElementById("message").textContent = "Staff created successfully!";
    document.getElementById("staffForm").reset();
    toggleStaffForm();
    loadDashboard();
    loadStaffList();
  } catch(e){
    console.error("Staff creation error:", e.message);
    document.getElementById("message").textContent = "Failed to create staff!";
  }
}

// ---------------- SHOW STAFF MODAL ----------------
function showStaffModal(staff){
  selectedStaffId = staff.id;
  document.getElementById("modalFullName").value = staff.full_name;
  document.getElementById("modalRole").value = staff.role;
  document.getElementById("modalDept").value = staff.department;
  document.getElementById("modalEmail").value = staff.email;
  document.getElementById("modalPhone").value = staff.phone;
  document.getElementById("modalAdmin").checked = staff.is_admin;
  document.getElementById("modalImagePreview").src = staff.image_url || "https://dummyimage.com/150x150/cccccc/000000.png&text=No+Image";
  document.getElementById("modalMessage").textContent = "";
  document.getElementById("staffModal").style.display = "block";
}

// ---------------- CLOSE MODAL ----------------
function closeModal(){
  document.getElementById("staffModal").style.display = "none";
}
window.onclick = function(event){
  if(event.target == document.getElementById("staffModal")) closeModal();
}

// ---------------- MODAL IMAGE PREVIEW ----------------
function previewModalImage(event){
  const img = document.getElementById("modalImagePreview");
  img.src = URL.createObjectURL(event.target.files[0]);
}

// ---------------- UPDATE STAFF ----------------
async function updateStaff(){
  if(!selectedStaffId) return;

  const full_name = document.getElementById("modalFullName").value;
  const role = document.getElementById("modalRole").value;
  const department = document.getElementById("modalDept").value;
  const email = document.getElementById("modalEmail").value;
  const phone = document.getElementById("modalPhone").value;
  const is_admin = document.getElementById("modalAdmin").checked;
  const fileInput = document.getElementById("modalImage");
  let image_url = null;

  if(fileInput.files.length > 0){
    const file = fileInput.files[0];
    const fileName = `${Date.now()}_${file.name.replace(/\s/g,'_')}`;
    const { data, error } = await window.supabaseClient
      .storage
      .from('staff_images')
      .upload(fileName, file);
    if(error){ 
      document.getElementById("modalMessage").textContent = "Image upload failed!";
      return; 
    }
    const { publicUrl } = window.supabaseClient
      .storage
      .from('staff_images')
      .getPublicUrl(fileName);
    image_url = publicUrl;
  }

  const updateData = { full_name, role, department, email, phone, is_admin };
  if(image_url) updateData.image_url = image_url;

  try {
    const { error } = await window.supabaseClient
      .from("staff")
      .update(updateData)
      .eq('id', selectedStaffId);
    if(error) throw error;

    document.getElementById("modalMessage").textContent = "Staff updated!";
    loadDashboard();
    loadStaffList();
  } catch(e){
    console.error("Staff update error:", e.message);
    document.getElementById("modalMessage").textContent = "Update failed!";
  }
}

// ---------------- DELETE STAFF ----------------
async function deleteStaff(){
  if(!selectedStaffId) return;
  if(!confirm("Are you sure you want to delete this staff?")) return;

  try {
    const { error } = await window.supabaseClient
      .from("staff")
      .delete()
      .eq('id', selectedStaffId);
    if(error) throw error;

    closeModal();
    loadDashboard();
    loadStaffList();
  } catch(e){
    console.error("Delete error:", e.message);
    document.getElementById("modalMessage").textContent = "Delete failed!";
  }
}

// ---------------- STAFF SEARCH ----------------
function filterStaff(){
  const query = document.getElementById("staffSearch").value.toLowerCase();
  displayStaffGrid(allStaff.filter(s => 
    s.full_name.toLowerCase().includes(query) ||
    s.role.toLowerCase().includes(query) ||
    s.department.toLowerCase().includes(query)
  ));
}

// ---------------- ON PAGE LOAD ----------------
window.addEventListener("DOMContentLoaded",()=>{
  loadDashboard();
  loadStaffList();
});
