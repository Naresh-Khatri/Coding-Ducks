import { Avatar, Box, Button, Flex, HStack, IconButton, LightMode, Spacer, Text } from '@chakra-ui/react'
import Sidebar from './Sidebar'

function MainLayout({ children }) {
    return (
        <>
            <Flex as='nav' alignItems={'center'} h={70} bg='brand.900' color={'white'} w={'100vw'}>
                <HStack alignItems={'center'}>
                    <IconButton bg={'transparent'} />
                    <Text>Coding Ducks</Text>
                </HStack>
                <Spacer />
                <Box>
                    <Text> 00:10:43 </Text>
                </Box>
                <Spacer />
                <HStack>
                    <Text>97/100</Text>
                    <Flex flexDir={'column'}>
                        <Text>naresh khatri</Text>
                        <Text>19fh1a0546</Text>
                    </Flex>
                    <Avatar name='Kola Tioluwani' src='https://bit.ly/tioluwani-kolawole' />
                    <IconButton icon={<LightMode />} />d
                    <Button variant={'solid'} bg={'red.400'}>Logout</Button>
                </HStack>
            </Flex>
            <Flex w={'100vw'} >
                <Sidebar />dd
                {children}
            </Flex>
        </>
    )
}

export default MainLayout