import { AddIcon } from '@chakra-ui/icons'
import {
  Button,
  Box,
  HStack,
  Select,
  useColorModeValue,
  IconButton,
  Tooltip,
} from '@chakra-ui/react'
import { IconProp } from '@fortawesome/fontawesome-svg-core'
import { faCode, faDeleteLeft, faStepBackward } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

interface ToolBarProps {
  isLoading?: boolean
  runCode?: () => void
  lang?: string
  setLang: (lang: string) => void
  theme?: string
  setTheme: (theme: string) => void
  onCodeRetrievalModalOpen?: () => void
  onCodeReset?: ()=>void
}

export default function ToolBar({
  lang,
  setLang,
  setTheme,
  onCodeRetrievalModalOpen,
  onCodeReset
}: ToolBarProps) {
  const color = useColorModeValue('black', 'white')
  return (
    <Box>
      <HStack p={2} justifyContent='end'>
        {onCodeReset&&(
          <Tooltip label='Reset code to initial state'>
            <IconButton
              aria-label='Reset code to initial state'
              icon={<FontAwesomeIcon icon={faDeleteLeft as IconProp} />}
              onClick={onCodeReset}
            />
          </Tooltip>

        )}
        {onCodeRetrievalModalOpen && (
          <Tooltip label='Retrieve last submitted code'>
            <IconButton
              aria-label='retrieve last submitted code'
              icon={<FontAwesomeIcon icon={faCode as IconProp} />}
              onClick={onCodeRetrievalModalOpen}
            />
          </Tooltip>
        )}
        <Select
          bg='purple.500'
          color='white'
          maxW={40}
          value={lang}
          onChange={(e) => {
            setLang(e.target.value)
            localStorage.setItem('lang', e.target.value)
          }}
          fontWeight='extrabold'
        >
          <option style={{ color: color }} value='py'>
            Python
          </option>
          <option style={{ color }} value='js'>
            Javascript
          </option>
          <option style={{ color }} value='cpp'>
            C++
          </option>
          <option style={{ color }} value='c'>
            C
          </option>
          <option style={{ color }} value='java'>
            Java
          </option>
        </Select>
        <Select
          maxW={40}
          onChange={(e) => {
            setTheme(e.target.value)
            localStorage.setItem('theme', e.target.value)
          }}
          bg='purple.500'
          color='white'
          fontWeight={'extrabold'}
        >
          <option style={{ color }} value='dracula'>
            Dracula
          </option>
          <option style={{ color }} value='atomone'>
            Atom One
          </option>
          <option style={{ color }} value='eclipse'>
            Eclipse
          </option>
          <option style={{ color }} value='okaidia'>
            Okaidia
          </option>
          <option style={{ color }} value='githubDark'>
            Github Dark
          </option>
          <option style={{ color }} value='githubLight'>
            Github Light
          </option>
          <option style={{ color }} value='duotoneDark'>
            Duotone Dark
          </option>
          <option style={{ color }} value='duotoneLight'>
            Duotone Light
          </option>
          <option style={{ color }} value='xcodeDark'>
            Xcode Dark
          </option>
          <option style={{ color }} value='xcodeLight'>
            Xcode Light
          </option>
        </Select>
      </HStack>
    </Box>
  )
}
