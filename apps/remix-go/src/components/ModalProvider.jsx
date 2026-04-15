import React, { createContext, useContext, useState, useEffect } from 'react'
import TextOverlayEditor from './modals/TextOverlayEditor'
import ImageOverlayEditor from './modals/ImageOverlayEditor'
import ScriptWriter from './modals/ScriptWriter'
import VoiceClone from './modals/VoiceClone'
import AvatarGenerator from './modals/AvatarGenerator'
import DynamicBackground from './modals/DynamicBackground'
import AIGeneratePanel from './modals/AIGeneratePanel'
import Teleprompter from './modals/Teleprompter'
import VideoUpload from './modals/VideoUpload'

const ModalContext = createContext()

export function useModal() {
  return useContext(ModalContext)
}

export function ModalProvider({ children }) {
  const [activeModal, setActiveModal] = useState(null)
  const [modalProps, setModalProps] = useState({})

  useEffect(() => {
    const handleToolAction = (event) => {
      const { action } = event.detail
      openModal(action, {})
    }

    window.addEventListener('remixGoTool', handleToolAction)
    return () => window.removeEventListener('remixGoTool', handleToolAction)
  }, [])

  const openModal = (modalType, props = {}) => {
    setActiveModal(modalType)
    setModalProps(props)
  }

  const closeModal = () => {
    setActiveModal(null)
    setModalProps({})
  }

  const renderModal = () => {
    if (!activeModal) return null

    const commonProps = {
      isOpen: true,
      onClose: closeModal,
      ...modalProps
    }

    switch (activeModal) {
      case 'textOverlay':
        return <TextOverlayEditor {...commonProps} />
      case 'imageEditor':
        return <ImageOverlayEditor {...commonProps} />
      case 'scriptWriter':
        return <ScriptWriter {...commonProps} />
      case 'voiceClone':
        return <VoiceClone {...commonProps} />
      case 'avatarGenerator':
        return <AvatarGenerator {...commonProps} />
      case 'dynamicBackground':
        return <DynamicBackground {...commonProps} />
      case 'aiGenerate':
        return <AIGeneratePanel {...commonProps} />
      case 'teleprompter':
        return <Teleprompter {...commonProps} />
      case 'videoUpload':
        return <VideoUpload {...commonProps} />
      default:
        return null
    }
  }

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      {renderModal()}
    </ModalContext.Provider>
  )
}
