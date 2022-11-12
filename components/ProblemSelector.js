import { Box, Center } from '@chakra-ui/react'
import React from 'react'

function ProblemSelector({ problem, isActive, isComplete }) {
    return (
        <Center
            borderRadius={10}
            maxH={10}
            bg={isComplete ? 'green.400' : 'brand.900'}
            border={isActive ? "2px solid white" : ""}>

            {problem}
        </Center>
    )
}

export default ProblemSelector