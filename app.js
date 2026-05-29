/* ==========================================================================
   PUBG Mobile Certificate Generator - Logic & Canvas Engine
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const usernameInput = document.getElementById('username');
    const fontStyleSelect = document.getElementById('fontStyle');
    const colorSwatches = document.querySelectorAll('.color-option');
    const btnDownload = document.getElementById('btnDownload');
    const nameOverlay = document.getElementById('nameOverlay');
    const certificatePreview = document.getElementById('certificatePreview');
    const bgTemplateImg = document.getElementById('bgTemplateImg');
    const exportCanvas = document.getElementById('exportCanvas');

    // Reward Modal DOM Elements
    const rewardModal = document.getElementById('rewardModal');
    const modalExportedImg = document.getElementById('modalExportedImg');
    const modalInstruction = document.getElementById('modalInstruction');
    const btnMapClose = document.getElementById('btnMapClose');
    const btnModalDownload = document.getElementById('btnModalDownload');

    // State Variables
    let currentName = usernameInput.value.trim() || 'Chiến Binh Chạy Bo';
    let currentFont = fontStyleSelect.value;
    let currentColor = 'gold'; // default

    // Initialize Preview Image with Base64 template
    if (bgTemplateImg && typeof CERTIFICATE_TEMPLATE_BASE64 !== 'undefined') {
        bgTemplateImg.src = CERTIFICATE_TEMPLATE_BASE64;
    }

    // ==========================================================================
    // 1. Live Preview Updating
    // ==========================================================================

    function updatePreview() {
        // Sync text
        nameOverlay.textContent = currentName;

        // Sync font family classes
        nameOverlay.className = 'name-overlay'; // reset classes
        nameOverlay.classList.add(currentFont);

        // Sync color classes
        nameOverlay.classList.add(`font-color-${currentColor}`);
    }

    // Handle name input typing
    usernameInput.addEventListener('input', (e) => {
        let name = e.target.value;
        currentName = name.trim() ? name : 'Đồng Bo Chạy Bo';
        updatePreview();
    });

    // Handle Font select changes
    fontStyleSelect.addEventListener('change', (e) => {
        currentFont = e.target.value;
        updatePreview();
    });

    // Handle color swatch changes
    colorSwatches.forEach(swatch => {
        swatch.addEventListener('click', function() {
            // Remove active from all
            colorSwatches.forEach(s => s.classList.remove('active'));
            // Add to clicked
            this.classList.add('active');
            
            // Get value
            const radio = this.querySelector('input[type="radio"]');
            radio.checked = true;
            currentColor = radio.value;
            
            updatePreview();
        });
    });

    // Run initial update
    updatePreview();

    // ==========================================================================
    // 2. High-Resolution Canvas Rendering & Export
    // ==========================================================================

    async function generateAndDownloadCertificate() {
        const originalText = btnDownload.innerHTML;
        
        try {
            // Set loading state
            btnDownload.disabled = true;
            btnDownload.style.pointerEvents = 'none';
            btnDownload.innerHTML = `
                <span class="btn-content">
                    <i class="fa-solid fa-circle-notch fa-spin btn-icon"></i>
                    <span>ĐANG XỬ LÝ ẢNH...</span>
                </span>
            `;

            // Wait for all custom fonts to be fully loaded in the document
            await document.fonts.ready;

            // Load the source template image in JS
            const templateImg = new Image();
            if (typeof CERTIFICATE_TEMPLATE_BASE64 !== 'undefined') {
                templateImg.src = CERTIFICATE_TEMPLATE_BASE64;
            } else {
                templateImg.src = 'assets/certificate_template.png'; // Fallback
            }
            
            // Wait for image loading
            await new Promise((resolve, reject) => {
                templateImg.onload = resolve;
                templateImg.onerror = reject;
            });

            // Get high-res canvas context
            const ctx = exportCanvas.getContext('2d');
            
            // Upgrade Canvas to Original Ultra-High Resolution (6250 x 4419)
            exportCanvas.width = 6250;
            exportCanvas.height = 4419;
            
            const cw = exportCanvas.width;   // 6250
            const ch = exportCanvas.height;  // 4419

            // Clear previous drawings
            ctx.clearRect(0, 0, cw, ch);

            // Enable premium high-quality image smoothing for crisp background scaling
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            // 1. Draw the base template image
            ctx.drawImage(templateImg, 0, 0, cw, ch);

            // 2. Setup text rendering configurations
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // 3. Define colors matching CSS variables
            let fillStyle = '#e2b13c'; // gold
            if (currentColor === 'red') fillStyle = '#c62828';
            else if (currentColor === 'black') fillStyle = '#212121';
            
            ctx.fillStyle = fillStyle;

            // 4. Calculate relative position
            // Matches left: 50.1%, top: 48.7%
            const targetX = cw * 0.501;
            let targetY = ch * 0.487;

            // 5. Select proper font style & baseline adjustments
            // Calculate baseFontSize as a percentage of canvas width (cw) to scale perfectly at 2x resolution!
            let baseFontSize = cw * 0.053;
            let fontStr = '';

            if (currentFont === 'calligraphy') {
                baseFontSize = cw * 0.074; // ~210px at 2828px width
                fontStr = `bold ${baseFontSize}px 'Alex Brush', cursive`;
                // Script fonts naturally sit higher, shift down slightly to sit on the underline
                targetY = ch * 0.481;
            } else if (currentFont === 'serif') {
                baseFontSize = cw * 0.055; // ~156px at 2828px width
                fontStr = `italic 800 ${baseFontSize}px 'Playfair Display', Georgia, serif`;
                targetY = ch * 0.484;
            } else if (currentFont === 'military') {
                baseFontSize = cw * 0.051; // ~144px at 2828px width
                fontStr = `bold ${baseFontSize}px 'Oswald', sans-serif`;
                targetY = ch * 0.482;
            }

            // 6. Font Autoscale Logic for Long Names
            // If length exceeds 14 chars, scale font size down proportionally
            const nameToDraw = currentName;
            if (nameToDraw.length > 14) {
                const scaleFactor = 14 / nameToDraw.length;
                const scaledSize = Math.max(baseFontSize * scaleFactor, cw * 0.025); // clamp minimum size
                
                if (currentFont === 'calligraphy') {
                    fontStr = `bold ${scaledSize}px 'Alex Brush', cursive`;
                } else if (currentFont === 'serif') {
                    fontStr = `italic 800 ${scaledSize}px 'Playfair Display', Georgia, serif`;
                } else if (currentFont === 'military') {
                    fontStr = `bold ${scaledSize}px 'Oswald', sans-serif`;
                }
            }

            ctx.font = fontStr;

            // 7. Draw the Name
            ctx.fillText(nameToDraw, targetX, targetY);

            // 8. Generate Image Data URL
            const dataUrl = exportCanvas.toDataURL('image/png');
            
            // Clean Vietnamese name to safe filename slug
            const safeName = nameToDraw
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/đ/g, 'd')
                .replace(/[^a-z0-9]/g, '_')
                .replace(/_+/g, '_');
                
            const filename = `giay_khen_pubg_${safeName || 'dong_bo'}.png`;

            // Display in Modal
            if (modalExportedImg) {
                modalExportedImg.src = dataUrl;
            }

            // Mobile Device Detection (Safari, Chrome iOS/Android & in-app webviews)
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (window.innerWidth <= 768);

            if (isMobile) {
                // Populate instructions for Mobile (Press and hold to save)
                if (modalInstruction) {
                    modalInstruction.className = 'modal-instruction mobile-alert';
                    modalInstruction.innerHTML = `<i class="fa-solid fa-fingerprint animate-pulse"></i> <strong>ĐỒNG BO CHÚ Ý (ĐIỆN THOẠI):</strong><br>Hãy <strong>NHẤN GIỮ VÀO HÌNH ẢNH TRÊN 2-3 GIÂY</strong> và chọn <strong>"LƯU HÌNH ẢNH"</strong> (hoặc "Tải hình ảnh xuống") để lưu trực tiếp về điện thoại nhé!`;
                }
                if (btnModalDownload) {
                    btnModalDownload.style.display = 'none'; // Hide programmatic download on mobile
                }
            } else {
                // Populate instructions for Desktop (Auto downloaded)
                if (modalInstruction) {
                    modalInstruction.className = 'modal-instruction';
                    modalInstruction.innerHTML = `<i class="fa-solid fa-circle-check" style="color: #4caf50;"></i> <strong>ĐÃ TỰ ĐỘNG TẢI GIẤY KHEN!</strong><br>Nếu ảnh chưa tự động tải về máy, hãy click nút <strong>TẢI XUỐNG LẠI</strong> bên dưới hoặc click chuột phải vào ảnh và chọn "Lưu hình ảnh thành..."`;
                }
                if (btnModalDownload) {
                    btnModalDownload.style.display = 'inline-flex';
                }

                // Trigger programmatic auto-download only on Desktop
                const downloadLink = document.createElement('a');
                downloadLink.download = filename;
                downloadLink.href = dataUrl;
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
            }

            // Open the Gaming Reward Modal!
            if (rewardModal) {
                rewardModal.style.display = 'flex';
            }

        } catch (error) {
            console.error('Error rendering certificate canvas:', error);
            alert('Có lỗi xảy ra khi tạo ảnh. Đồng bo vui lòng thử lại!');
        } finally {
            // Restore button state
            btnDownload.disabled = false;
            btnDownload.style.pointerEvents = 'auto';
            btnDownload.innerHTML = originalText;
        }
    }

    // Modal Event Listeners (Close, Download again)
    function closeModal() {
        if (rewardModal) {
            rewardModal.style.display = 'none';
        }
    }

    if (btnMapClose) {
        btnMapClose.addEventListener('click', closeModal);
    }

    // Close when clicking overlay (outside card)
    if (rewardModal) {
        rewardModal.addEventListener('click', (e) => {
            if (e.target === rewardModal) {
                closeModal();
            }
        });
    }

    // Modal download button action (re-trigger download on Desktop)
    if (btnModalDownload) {
        btnModalDownload.addEventListener('click', () => {
            const dataUrl = modalExportedImg.src;
            const safeName = currentName
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/đ/g, 'd')
                .replace(/[^a-z0-9]/g, '_')
                .replace(/_+/g, '_');
            
            const downloadLink = document.createElement('a');
            downloadLink.download = `giay_khen_pubg_${safeName || 'dong_bo'}.png`;
            downloadLink.href = dataUrl;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        });
    }

    // Bind Download Button Action
    btnDownload.addEventListener('click', generateAndDownloadCertificate);
});
