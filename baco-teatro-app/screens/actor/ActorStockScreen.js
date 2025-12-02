import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, Linking, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import ScreenContainer from '../../components/ScreenContainer';
import SectionCard from '../../components/SectionCard';
import TicketStatusPill from '../../components/TicketStatusPill';
import Toast from '../../components/Toast';
import { useToast } from '../../hooks/useToast';
import colors from '../../theme/colors';
import { getActorStock, updateTicketStatus } from '../../api';
import DailyQuote from '../../components/DailyQuote';

// Web-only imports
let jsPDF = null;
let html2canvas = null;
if (Platform.OS === 'web') {
  import('jspdf').then(module => { jsPDF = module.default; });
  import('html2canvas').then(module => { html2canvas = module.default; });
}

export default function ActorStockScreen() {
  const { toast, showSuccess, showError, showWarning, hideToast } = useToast();
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('UPDATE'); // 'UPDATE' | 'SHARE'
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedShowName, setSelectedShowName] = useState('');
  const [selectedShowDate, setSelectedShowDate] = useState('');
  const [selectedShowLocation, setSelectedShowLocation] = useState('');
  const [targetStatus, setTargetStatus] = useState(null);
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [countryCode, setCountryCode] = useState('598');
  const [processing, setProcessing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getActorStock();
      setStock(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openModal = (ticket, status) => {
    setModalMode('UPDATE');
    // Only ask for details if reserving or selling
    if (status === 'RESERVADO' || status === 'REPORTADA_VENDIDA') {
      setSelectedTicket(ticket);
      setTargetStatus(status);
      setBuyerName(ticket.comprador_nombre || '');
      setBuyerPhone(ticket.comprador_telefono || '');
      setModalVisible(true);
    } else {
      // For 'PAGADO' or others, just update directly
      handleUpdate(ticket.id, status);
    }
  };

  const openShareModal = (ticket, group) => {
    setSelectedTicket(ticket);
    setSelectedShowName(group.obra);
    setSelectedShowDate(group.fecha);
    setSelectedShowLocation(group.lugar);
    setModalMode('SHARE');
    setBuyerPhone(ticket.comprador_telefono || '');
    setModalVisible(true);
  };

  const handleUpdate = async (ticketId, estado, details = {}) => {
    setProcessing(true);
    try {
      await updateTicketStatus({ 
        ticketId, 
        estado,
        ...details
      });
      setModalVisible(false);
      load();
      showSuccess('✅ Ticket actualizado con éxito');
    } catch (error) {
      showError(error.message || 'No se pudo actualizar el ticket');
    } finally {
      setProcessing(false);
    }
  };

  const confirmModal = async () => {
    if (modalMode === 'SHARE') {
      if (!buyerPhone) {
        showError('Ingresá el número de teléfono para registrar el envío');
        return;
      }

      // 1. Update buyer info first
      const fullPhone = countryCode + buyerPhone.replace(/\D/g, '');
      try {
        await updateTicketStatus({ 
          ticketId: selectedTicket.id, 
          estado: selectedTicket.estado, // Keep same status
          comprador_telefono: fullPhone
        });
      } catch (e) {
        console.log('Error updating phone', e);
      }
      
      // 2. Generate and Share PDF
      setProcessing(true);

      // Pre-fetch QR Code as Base64 to ensure it renders
      let qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${selectedTicket.code}&bgcolor=ffffff`;
      try {
        const response = await fetch(qrSrc);
        const blob = await response.blob();
        const base64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
        qrSrc = base64;
      } catch (e) {
        console.log('Error fetching QR, using URL fallback');
      }

      const html = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Montserrat:wght@400;600;800&family=Roboto+Mono:wght@500&display=swap');
            
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              box-sizing: border-box;
            }

            body {
              margin: 0;
              padding: 0;
              background-color: #000;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }

            /* Container to force background color printing via box-shadow hack if needed, 
               but explicit background-color with print-color-adjust usually works. */
            .ticket-wrapper {
              padding: 20px;
              background: #000;
            }

            .ticket {
              width: 800px;
              height: 320px;
              /* Fallback background color */
              background-color: #12090D;
              /* Gradient background with texture */
              background-image: 
                radial-gradient(circle at 85% 20%, #370617 0%, transparent 70%),
                repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 10px);
              border-radius: 20px;
              display: flex;
              position: relative;
              overflow: hidden;
              border: 2px solid #F48C06;
              box-shadow: 0 0 50px rgba(244, 140, 6, 0.1);
            }

            .main-content {
              flex: 1;
              padding: 35px 40px;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              border-right: 3px dashed rgba(244, 140, 6, 0.5);
              position: relative;
              z-index: 2;
            }

            .stub {
              width: 250px;
              background-color: #1B0E14;
              padding: 25px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              position: relative;
              z-index: 2;
            }

            /* Notches */
            .notch {
              position: absolute;
              width: 40px;
              height: 40px;
              background-color: #000; /* Match body bg */
              border-radius: 50%;
              z-index: 10;
              right: 230px;
            }
            .notch-top { top: -20px; border-bottom: 2px solid #F48C06; }
            .notch-bottom { bottom: -20px; border-top: 2px solid #F48C06; }

            /* Branding */
            .brand-row {
              display: flex;
              align-items: center;
              gap: 15px;
              margin-bottom: 10px;
            }
            
            .brand-logo {
              font-family: 'Playfair Display', serif;
              font-size: 22px;
              color: #F48C06;
              text-transform: uppercase;
              letter-spacing: 3px;
              font-weight: 900;
            }

            .show-title {
              font-family: 'Playfair Display', serif;
              font-size: 42px;
              color: #F5F1ED;
              margin: 0;
              line-height: 1;
              text-transform: uppercase;
              text-shadow: 3px 3px 0 #370617;
              max-width: 450px;
            }

            /* Info Grid */
            .info-grid {
              display: grid;
              grid-template-columns: auto auto;
              gap: 25px 40px;
              margin-top: auto;
            }

            .info-group label {
              display: block;
              color: #F48C06;
              font-family: 'Montserrat', sans-serif;
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 1.5px;
              margin-bottom: 4px;
              font-weight: 800;
            }

            .info-group span {
              color: #fff;
              font-family: 'Montserrat', sans-serif;
              font-size: 16px;
              font-weight: 600;
              display: block;
            }

            /* QR & Stub */
            .qr-frame {
              background: #fff;
              padding: 8px;
              border-radius: 8px;
              margin-bottom: 15px;
              box-shadow: 0 4px 15px rgba(0,0,0,0.5);
            }
            
            .qr-code {
              width: 150px;
              height: 150px;
              display: block;
            }

            .ticket-id {
              font-family: 'Roboto Mono', monospace;
              color: #F48C06;
              font-size: 11px;
              letter-spacing: 1px;
              text-align: center;
              opacity: 0.8;
            }

            /* Status Badge */
            .status-badge {
              position: absolute;
              top: 35px;
              right: 30px;
              border: 2px solid #F48C06;
              color: #F48C06;
              padding: 6px 16px;
              border-radius: 4px;
              font-family: 'Montserrat', sans-serif;
              font-weight: 900;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 1px;
              background: rgba(244, 140, 6, 0.15);
              transform: rotate(-5deg);
            }

            /* Decorative Elements */
            .gold-strip {
              position: absolute;
              left: 0;
              top: 0;
              bottom: 0;
              width: 8px;
              background: linear-gradient(to bottom, #F48C06, #FFBE0B, #F48C06);
              z-index: 5;
            }
          </style>
        </head>
        <body>
          <div class="ticket-wrapper">
            <div class="ticket">
              <div class="gold-strip"></div>
              <div class="notch notch-top"></div>
              <div class="notch notch-bottom"></div>
              
              <div class="main-content">
                <div>
                  <div class="brand-row">
                    <span style="color: #F48C06; font-size: 20px;">★</span>
                    <div class="brand-logo">Baco Teatro</div>
                    <span style="color: #F48C06; font-size: 20px;">★</span>
                  </div>
                  <h1 class="show-title">${selectedShowName}</h1>
                </div>
                
                <div class="info-grid">
                  <div class="info-group">
                    <label>Fecha</label>
                    <span>${new Date(selectedShowDate).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                  </div>
                  <div class="info-group">
                    <label>Hora</label>
                    <span>${new Date(selectedShowDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} HS</span>
                  </div>
                  <div class="info-group">
                    <label>Lugar</label>
                    <span>${selectedShowLocation}</span>
                  </div>
                  <div class="info-group">
                    <label>Precio</label>
                    <span>$${selectedTicket.precio}</span>
                  </div>
                </div>

                <div class="status-badge">
                  ${selectedTicket.estado === 'PAGADO' ? 'PAGADO' : 'PENDIENTE'}
                </div>
              </div>

              <div class="stub">
                <div class="qr-frame">
                  <img src="${qrSrc}" class="qr-code" />
                </div>
                <div class="ticket-id">ID: ${selectedTicket.code}</div>
              </div>
            </div>
          </div>
        </body>
      </html>
      `;

      try {
        if (Platform.OS === 'web') {
          // Web-specific: Generate PDF using html2canvas + jsPDF with Iframe isolation
          if (!jsPDF || !html2canvas) {
            showError('Librerías de PDF no cargadas. Intentá de nuevo en unos segundos.');
            return;
          }

          // Create a hidden iframe to render the HTML in isolation
          const iframe = document.createElement('iframe');
          iframe.style.position = 'fixed';
          iframe.style.top = '-10000px';
          iframe.style.left = '-10000px';
          iframe.style.width = '1000px'; // Fixed width for consistent rendering
          iframe.style.height = '1000px';
          iframe.style.border = 'none';
          document.body.appendChild(iframe);

          // Write HTML to iframe
          const doc = iframe.contentWindow.document;
          doc.open();
          doc.write(html);
          doc.close();

          // Wait for iframe content (including images/fonts) to load
          await new Promise((resolve) => {
            iframe.onload = resolve;
            // Fallback if onload doesn't fire quickly
            setTimeout(resolve, 1000);
          });

          // Wait a bit more for fonts to settle
          await new Promise(r => setTimeout(r, 500));

          // Capture the ticket element from within the iframe
          const ticketElement = doc.querySelector('.ticket-wrapper');
          if (!ticketElement) throw new Error('Ticket element not found in iframe');

          const canvas = await html2canvas(ticketElement, {
            scale: 2, // Higher quality
            backgroundColor: '#000000',
            useCORS: true,
            logging: false,
            windowWidth: 1000,
            windowHeight: 1000
          });

          // Generate PDF
          const imgData = canvas.toDataURL('image/jpeg', 0.95);
          const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [canvas.width, canvas.height]
          });

          pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
          
          // Clean up
          document.body.removeChild(iframe);

          // Share or Download
          const pdfBlob = pdf.output('blob');
          const pdfFile = new File([pdfBlob], `Entrada_${selectedTicket.code}.pdf`, { type: 'application/pdf' });

          if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
            try {
              const whatsappMessage = `🎭 *¡Tu entrada está lista!*\n\n` +
                `✨ *${selectedShowName}*\n` +
                `📅 ${new Date(selectedTicket.showDate).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n` +
                `🕐 ${new Date(selectedTicket.showDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} hs\n` +
                `📍 ${selectedTicket.lugar || 'Ver en la entrada'}\n\n` +
                `🎟️ *Código:* ${selectedTicket.code}\n` +
                `💰 *Precio:* $${selectedTicket.precio}\n\n` +
                `📎 Encontrarás tu entrada adjunta en PDF.\n` +
                `🔍 Presenta el código QR en la entrada del teatro.\n\n` +
                `🎬 *Baco Teatro* - 25 años de historia\n` +
                `_Dirigido por Gustavo Bouzas y Horacio Nieves_\n\n` +
                `¡Te esperamos! 🌟`;

              await navigator.share({
                files: [pdfFile],
                title: '🎭 Entrada Baco Teatro',
                text: whatsappMessage
              });
            } catch (shareError) {
              console.log('Share cancelled or failed', shareError);
            }
          } else {
            // Fallback to download
            pdf.save(`Entrada_${selectedTicket.code}.pdf`);
            showSuccess('💾 Entrada descargada con éxito');
          }

        } else {
          const { uri } = await Print.printToFileAsync({ 
            html,
            width: 840,
            height: 360
          });
          await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        }
      } catch (error) {
        console.error(error);
        showError('No se pudo generar el PDF: ' + error.message);
      } finally {
        setProcessing(false);
        setModalVisible(false);
      }
      return;
    }

    if (!selectedTicket || !targetStatus) return;
    handleUpdate(selectedTicket.id, targetStatus, {
      comprador_nombre: buyerName,
      comprador_telefono: buyerPhone
    });
  };

  if (loading) {
    return (
      <ScreenContainer scrollable={false}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.secondary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <LinearGradient
        colors={['#4B0082', '#8B008B', '#9370DB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>🎫 Mi Stock</Text>
            <Text style={styles.headerSubtitle}>Gestión de entradas</Text>
          </View>
          <MaterialCommunityIcons name="ticket-confirmation" size={48} color="#FFD700" />
        </View>
      </LinearGradient>
      
      <DailyQuote variant="card" />
      {stock.map((group) => (
        <SectionCard
          key={group.showId}
          title={group.obra}
          subtitle={`${group.tickets.length} entradas · Vendidas ${group.vendidas} · Pagadas ${group.pagadas}`}
        >
          {group.tickets.map((ticket) => (
            <View key={ticket.id} style={styles.ticketRow}>
              <View>
                <Text style={styles.ticketCode}>{ticket.code}</Text>
                <Text style={styles.meta}>Precio ${ticket.precio}</Text>
                {(ticket.comprador_nombre || ticket.comprador_telefono) && (
                  <Text style={styles.buyerInfo}>
                    {ticket.comprador_nombre} {ticket.comprador_telefono ? `(${ticket.comprador_telefono})` : ''}
                  </Text>
                )}
              </View>
              <View style={styles.ticketActions}>
                <TicketStatusPill estado={ticket.estado} />
                <View style={styles.actionsRow}>
                  {ticket.estado === 'STOCK_VENDEDOR' && (
                    <TouchableOpacity onPress={() => openModal(ticket, 'RESERVADO')}>
                      <Text style={styles.actionText}>Reservar</Text>
                    </TouchableOpacity>
                  )}
                  {['STOCK_VENDEDOR', 'RESERVADO'].includes(ticket.estado) && (
                    <TouchableOpacity onPress={() => openModal(ticket, 'REPORTADA_VENDIDA')}>
                      <Text style={styles.actionText}>Vendida</Text>
                    </TouchableOpacity>
                  )}
                  {/* Actor cannot mark as PAGADO anymore, only Director */}
                  {['REPORTADA_VENDIDA', 'PAGADO'].includes(ticket.estado) && (
                    <TouchableOpacity onPress={() => openShareModal(ticket, group)} style={styles.iconButton}>
                      <Ionicons name="logo-whatsapp" size={22} color={colors.success} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          ))}
        </SectionCard>
      ))}
      {stock.length === 0 && <Text style={styles.empty}>Sin entradas asignadas todavía</Text>}

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {modalMode === 'SHARE' ? 'Enviar Entrada' : (targetStatus === 'RESERVADO' ? 'Reservar Entrada' : 'Registrar Venta')}
            </Text>
            <Text style={styles.modalSubtitle}>
              {modalMode === 'SHARE' ? 'Se generará el PDF oficial para enviar por WhatsApp.' : 'Opcional: Ingresa los datos del comprador'}
            </Text>

            {modalMode === 'UPDATE' && (
              <>
                <Text style={styles.label}>Nombre</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nombre del comprador"
                  placeholderTextColor={colors.textSoft}
                  value={buyerName}
                  onChangeText={setBuyerName}
                />
              </>
            )}

            <Text style={styles.label}>Teléfono (WhatsApp)</Text>
            <View style={styles.phoneRow}>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={countryCode}
                  onValueChange={(itemValue) => setCountryCode(itemValue)}
                  style={styles.picker}
                  dropdownIconColor={colors.white}
                >
                  <Picker.Item label="🇺🇾 +598" value="598" color={Platform.OS === 'ios' ? colors.text : colors.background} />
                  <Picker.Item label="🇦🇷 +54" value="54" color={Platform.OS === 'ios' ? colors.text : colors.background} />
                  <Picker.Item label="🇨🇱 +56" value="56" color={Platform.OS === 'ios' ? colors.text : colors.background} />
                  <Picker.Item label="🇧🇷 +55" value="55" color={Platform.OS === 'ios' ? colors.text : colors.background} />
                  <Picker.Item label="🇵🇾 +595" value="595" color={Platform.OS === 'ios' ? colors.text : colors.background} />
                  <Picker.Item label="🇪🇸 +34" value="34" color={Platform.OS === 'ios' ? colors.text : colors.background} />
                  <Picker.Item label="🇺🇸 +1" value="1" color={Platform.OS === 'ios' ? colors.text : colors.background} />
                </Picker>
              </View>
              <TextInput
                style={[styles.input, styles.phoneInput]}
                placeholder="Ej: 99123456"
                placeholderTextColor={colors.textSoft}
                keyboardType="phone-pad"
                value={buyerPhone}
                onChangeText={setBuyerPhone}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton, modalMode === 'SHARE' && { backgroundColor: colors.success }]} 
                onPress={confirmModal}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator color={colors.black} />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {modalMode === 'SHARE' ? 'Enviar PDF por WhatsApp' : 'Confirmar'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      <Toast 
        visible={toast.visible} 
        message={toast.message} 
        type={toast.type}
        onHide={hideToast}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerGradient: {
    marginHorizontal: -20,
    marginTop: -20,
    marginBottom: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#4B0082',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFD700',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.9,
    marginTop: 4,
    fontWeight: '600',
  },
  ticketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 70,
  },
  ticketCode: { color: colors.white, fontWeight: '700', fontSize: 15 },
  meta: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  buyerInfo: { color: colors.secondary, fontSize: 13, fontStyle: 'italic', marginTop: 2 },
  ticketActions: { alignItems: 'flex-end', gap: 10, justifyContent: 'center' },
  actionsRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  iconButton: { padding: 6, borderRadius: 8, backgroundColor: colors.surface },
  actionText: { color: colors.secondary, fontWeight: '600' },
  empty: { color: colors.textSoft, textAlign: 'center', marginTop: 40 },
  
  phoneRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  pickerContainer: { flex: 0.35, backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', height: 50 },
  picker: { color: colors.white, height: 50 },
  phoneInput: { flex: 0.65, marginBottom: 0 },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    color: colors.secondary,
    fontSize: 12,
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    color: colors.text,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    minHeight: 50,
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.textMuted,
  },
  saveButton: {
    backgroundColor: colors.secondary,
  },
  cancelButtonText: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  saveButtonText: {
    color: colors.black,
    fontWeight: 'bold',
    fontSize: 15,
  },
});
