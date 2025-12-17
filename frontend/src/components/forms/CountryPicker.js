import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import {COUNTRIES} from '../../constants/countries';
import {COLORS} from '../../constants/colors';

const CountryPicker = ({selectedCountry, onSelectCountry}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelect = country => {
    onSelectCountry(country);
    setModalVisible(false);
  };

  return (
    <View>
      <TouchableOpacity
        style={styles.pickerButton}
        onPress={() => setModalVisible(true)}>
        <Text style={styles.flag}>{selectedCountry.flag}</Text>
        <Text style={styles.dialCode}>{selectedCountry.dialCode}</Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={COUNTRIES}
              keyExtractor={item => item.code}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={styles.countryItem}
                  onPress={() => handleSelect(item)}>
                  <Text style={styles.countryFlag}>{item.flag}</Text>
                  <Text style={styles.countryName}>{item.name}</Text>
                  <Text style={styles.countryCode}>{item.dialCode}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
    borderRightWidth: 2,
    borderRightColor: COLORS.border,
  },
  flag: {
    fontSize: 24,
    marginRight: 6,
  },
  dialCode: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginRight: 4,
  },
  arrow: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  closeButton: {
    fontSize: 24,
    color: COLORS.textSecondary,
    fontWeight: '300',
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  countryFlag: {
    fontSize: 28,
    marginRight: 12,
  },
  countryName: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  countryCode: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
});

export default CountryPicker;

